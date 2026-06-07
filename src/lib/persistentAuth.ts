import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Set when user explicitly signs out — blocks silent anonymous re-login until they sign in again. */
export const SIGNED_OUT_FLAG = "shadowtalk_signed_out";
export const RETURN_TO_KEY = "shadowtalk_return_to";
export const LAST_WORKSPACE_KEY = "shadowtalk_last_workspace";

const DEFAULT_WORKSPACE = "/chatbot";

export function markExplicitSignOut() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SIGNED_OUT_FLAG, "1");
  }
}

export function clearExplicitSignOut() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SIGNED_OUT_FLAG);
  }
}

export function hasExplicitSignOut(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SIGNED_OUT_FLAG) === "1";
}

export function saveReturnPath(path: string) {
  if (typeof localStorage === "undefined") return;
  if (path.startsWith("/auth")) return;
  localStorage.setItem(RETURN_TO_KEY, path);
}

export function consumeReturnPath(): string {
  if (typeof localStorage === "undefined") return DEFAULT_WORKSPACE;
  const path = localStorage.getItem(RETURN_TO_KEY) || DEFAULT_WORKSPACE;
  localStorage.removeItem(RETURN_TO_KEY);
  return path.startsWith("/") ? path : DEFAULT_WORKSPACE;
}

export function rememberWorkspacePath(path: string) {
  if (typeof localStorage === "undefined") return;
  if (!path.startsWith("/") || path === "/auth") return;
  localStorage.setItem(LAST_WORKSPACE_KEY, path);
}

export function getRememberedWorkspacePath(): string {
  if (typeof localStorage === "undefined") return DEFAULT_WORKSPACE;
  const path = localStorage.getItem(LAST_WORKSPACE_KEY);
  return path?.startsWith("/") ? path : DEFAULT_WORKSPACE;
}

export function isAnonymousUser(session: Session | null): boolean {
  if (!session?.user) return false;
  return session.user.is_anonymous === true;
}

const AUTH_BOOTSTRAP_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[Auth] ${label} timed out after ${ms}ms`);
      resolve(null);
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

/**
 * Restore Supabase session from storage, or create a persistent anonymous session
 * (Gemini-style: open app → already signed in).
 */
export async function restoreOrCreateSession(): Promise<Session | null> {
  const sessionResult = await withTimeout(
    supabase.auth.getSession(),
    AUTH_BOOTSTRAP_TIMEOUT_MS,
    "getSession",
  );
  if (!sessionResult) return null;

  const { data: { session: existing }, error: getErr } = sessionResult;
  if (getErr) {
    console.warn("[Auth] getSession failed:", getErr.message);
  }
  if (existing) {
    clearExplicitSignOut();
    return existing;
  }

  if (hasExplicitSignOut()) {
    return null;
  }

  // Enterprise deployments: require work-email sign-in (no anonymous sessions)
  if (import.meta.env.VITE_ENTERPRISE_MODE === "true") {
    return null;
  }

  const anonResult = await withTimeout(
    supabase.auth.signInAnonymously(),
    AUTH_BOOTSTRAP_TIMEOUT_MS,
    "signInAnonymously",
  );
  if (!anonResult) return null;

  const { data, error } = anonResult;
  if (error) {
    console.warn("[Auth] Anonymous session unavailable:", error.message);
    return null;
  }

  clearExplicitSignOut();
  return data.session ?? null;
}

export async function refreshSessionIfNeeded(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const expiresAt = session.expires_at ?? 0;
  const expiresInSec = expiresAt - Math.floor(Date.now() / 1000);
  if (expiresInSec < 120) {
    await supabase.auth.refreshSession();
  }
}

import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Set when user explicitly signs out — blocks silent anonymous re-login until they sign in again. */
export const SIGNED_OUT_FLAG = "shadowtalk_signed_out";
export const RETURN_TO_KEY = "shadowtalk_return_to";
export const LAST_WORKSPACE_KEY = "shadowtalk_last_workspace";

const DEFAULT_WORKSPACE = "/chatbot";
const AUTH_BOOTSTRAP_TIMEOUT_MS = 20_000;
const AUTH_BOOTSTRAP_RETRIES = 3;
/** Refresh access token when less than this many seconds remain. */
const REFRESH_THRESHOLD_SEC = 600;
const REFRESH_MAX_ATTEMPTS = 3;

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

async function getStoredSession(): Promise<Session | null> {
  for (let attempt = 1; attempt <= AUTH_BOOTSTRAP_RETRIES; attempt++) {
    const sessionResult = await withTimeout(
      supabase.auth.getSession(),
      AUTH_BOOTSTRAP_TIMEOUT_MS,
      `getSession (attempt ${attempt})`,
    );
    if (!sessionResult) {
      if (attempt < AUTH_BOOTSTRAP_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      return null;
    }

    const { data: { session }, error } = sessionResult;
    if (error) {
      console.warn("[Auth] getSession failed:", error.message);
    }
    if (session) return session;
    if (attempt < AUTH_BOOTSTRAP_RETRIES) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return null;
}

/**
 * Restore Supabase session from storage, or create a persistent anonymous session
 * (Gemini-style: open app → already signed in).
 */
export async function restoreOrCreateSession(): Promise<Session | null> {
  const existing = await getStoredSession();
  if (existing) {
    clearExplicitSignOut();
    return existing;
  }

  if (hasExplicitSignOut()) {
    return null;
  }

  if (import.meta.env.VITE_ENTERPRISE_MODE === "true") {
    return null;
  }

  for (let attempt = 1; attempt <= AUTH_BOOTSTRAP_RETRIES; attempt++) {
    const anonResult = await withTimeout(
      supabase.auth.signInAnonymously(),
      AUTH_BOOTSTRAP_TIMEOUT_MS,
      `signInAnonymously (attempt ${attempt})`,
    );
    if (!anonResult) {
      if (attempt < AUTH_BOOTSTRAP_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      return null;
    }

    const { data, error } = anonResult;
    if (error) {
      console.warn("[Auth] Anonymous session unavailable:", error.message);
      return null;
    }

    clearExplicitSignOut();
    return data.session ?? null;
  }

  return null;
}

/** Proactively refresh JWT so users stay signed in across days/weeks of use. */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const expiresAt = session.expires_at ?? 0;
  const expiresInSec = expiresAt - Math.floor(Date.now() / 1000);
  if (expiresInSec >= REFRESH_THRESHOLD_SEC) return true;

  for (let attempt = 1; attempt <= REFRESH_MAX_ATTEMPTS; attempt++) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      clearExplicitSignOut();
      return true;
    }
    console.warn(`[Auth] refreshSession attempt ${attempt} failed:`, error?.message);
    if (attempt < REFRESH_MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return false;
}

/** Keys that must survive "clear local data" so users stay signed in. */
export const PRESERVE_ON_LOCAL_CLEAR = [
  SIGNED_OUT_FLAG,
  RETURN_TO_KEY,
  LAST_WORKSPACE_KEY,
  "shadowtalk_session_token",
  "shadowtalk_offline_auth",
] as const;

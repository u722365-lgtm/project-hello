import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { UserIdentity } from "@supabase/supabase-js";

export type AuthProvider = "google" | "apple";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export class MissingOAuthSecretError extends Error {
  constructor(provider: string) {
    super(`${provider} OAuth is not configured. Use email or local login instead.`);
    this.name = "MissingOAuthSecretError";
  }
}

export async function signInWithRemoteProvider(provider: AuthProvider, opts?: SignInOptions) {
  try {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: opts?.redirect_uri ?? (typeof window !== "undefined" ? window.location.origin : undefined),
      extraParams: opts?.extraParams,
    });

    if ((result as any)?.error) {
      const err = (result as any).error;
      const msg = err?.message || String(err);
      console.warn("[Auth][signInWithRemoteProvider] error", { provider, msg });
      if (/missing OAuth secret|not enabled|Unsupported provider/i.test(msg)) {
        return { error: new MissingOAuthSecretError(provider) };
      }
      return { error: new Error(msg) };
    }

    return result as { redirected?: boolean };
  } catch (e) {
    console.warn("[Auth][signInWithRemoteProvider] exception", { provider, error: e });
    return { error: e instanceof Error ? e : new Error("Failed to connect") };
  }
}


export function isLocalFirst(): boolean {
  return import.meta.env.VITE_LOCAL_FIRST === "true";
}

export async function signInWithLocalPreferredProvider() {
  if (typeof window === "undefined") return { redirected: true };
  const desktop = (window as any).shadowtalkDesktop as
    | { preferredLogin?: () => Promise<{ redirected: boolean; error?: Error }> }
    | undefined;
  if (desktop?.preferredLogin) {
    return desktop.preferredLogin();
  }

  return {
    redirected: true,
    error: new Error(
      "Local-first preferred login is not available in this context. Provide a `shadowtalkDesktop.preferredLogin` handler, or disable local-first mode.",
    ),
  };
}

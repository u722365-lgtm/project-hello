import { supabase } from "@/integrations/supabase/client";
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

/**
 * Sign in with a remote OAuth provider (Google, Apple).
 *
 * Uses Supabase auth directly (the Lovable auth wrapper is unreliable —
 * @lovable.dev/cloud-auth-js may not be installed in all deploy targets).
 *
 * Flow:
 *   1. Supabase redirects to Google/Apple consent screen
 *   2. User picks account
 *   3. Provider redirects back to app with #access_token= in URL fragment
 *   4. Supabase client (detectSessionInUrl: true) auto-parses the fragment
 *   5. AuthProvider's onAuthStateChange('SIGNED_IN') fires → user is logged in
 */
export async function signInWithRemoteProvider(provider: AuthProvider, opts?: SignInOptions) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: opts?.redirect_uri ?? (typeof window !== 'undefined' ? window.location.origin : undefined),
        ...opts?.extraParams,
      },
    });

    if (error) {
      const msg = error.message || String(error);
      console.warn("[Auth][signInWithRemoteProvider] error", { provider, msg });
      if (/missing OAuth secret|not enabled|Unsupported provider/i.test(msg)) {
        return { error: new MissingOAuthSecretError(provider) };
      }
      return { error: new Error(msg) };
    }

    return { redirected: true };
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
      "Local-first preferred login is not available in this context.",
    ),
  };
}

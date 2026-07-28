import { supabase } from "@/integrations/supabase/client";
import type { UserIdentity } from "@supabase/supabase-js";

export type AuthProvider = "google" | "apple";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export async function signInWithRemoteProvider(provider: AuthProvider, opts?: SignInOptions) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: opts?.redirect_uri,
        ...opts?.extraParams,
      },
    });

    if (error) {
      console.warn('[Auth][signInWithRemoteProvider] error', { provider, error: error.message });
      return { error: new Error(error.message) };
    }

    if (typeof window !== "undefined" && data?.url) {
      console.log('[Auth][signInWithRemoteProvider] redirect', { provider, url: data.url });
      window.location.href = data.url;
    }

    return {};
  } catch (e) {
    console.warn('[Auth][signInWithRemoteProvider] exception', { provider, error: e instanceof Error ? e.message : 'Failed to connect' });
    return { error: e instanceof Error ? e : new Error('Failed to connect') };
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

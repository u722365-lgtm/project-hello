/**
 * Remote auth — uses Supabase Auth when configured.
 * Falls back to local-only when Supabase is not available.
 */

import { backend, isConfigured } from '@/integrations/local/client';

export type AuthProvider = "google" | "apple";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export class MissingOAuthSecretError extends Error {
  constructor(provider: string) {
    super(`${provider} OAuth is not yet configured. Please use email login.`);
    this.name = "MissingOAuthSecretError";
  }
}

export async function signInWithRemoteProvider(provider: AuthProvider, opts?: SignInOptions) {
  if (!isConfigured) {
    return { error: new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env') };
  }
  try {
    const { data, error } = await backend.auth.signInWithOAuth({
      provider,
      redirectTo: opts?.redirect_uri || window.location.origin + '/auth',
    });
    if (error) return { error };
    return { redirected: true, url: data.url };
  } catch (err: any) {
    return { error: err };
  }
}

export function isLocalFirst(): boolean {
  return !isConfigured;
}

export async function signInWithLocalPreferredProvider() {
  return {
    redirected: false,
    error: new Error('Local-only mode. Please sign in with email.'),
  };
}

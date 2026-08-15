/**
 * Remote auth — local-only mode stub.
 * All auth is handled via the local backend stub.
 */

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

export async function signInWithRemoteProvider(provider: AuthProvider, _opts?: SignInOptions) {
  return { error: new Error(`${provider} OAuth is not available in local-only mode. Please sign in with email.`) };
}

export function isLocalFirst(): boolean {
  return true;
}

export async function signInWithLocalPreferredProvider() {
  return {
    redirected: false,
    error: new Error('Local-only mode. Please sign in with email.'),
  };
}

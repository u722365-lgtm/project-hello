/**
 * Remote auth stub — all OAuth providers removed.
 * ShadowTalk now uses local-only authentication.
 */

export type AuthProvider = "google" | "apple";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export class MissingOAuthSecretError extends Error {
  constructor(provider: string) {
    super(`${provider} OAuth is no longer available. Please use email login.`);
    this.name = "MissingOAuthSecretError";
  }
}

export async function signInWithRemoteProvider(provider: AuthProvider, _opts?: SignInOptions) {
  return {
    error: new MissingOAuthSecretError(provider),
  };
}

export function isLocalFirst(): boolean {
  return true;
}

export async function signInWithLocalPreferredProvider() {
  return {
    redirected: true,
    error: new Error("Local-only mode. Please sign in with email."),
  };
}

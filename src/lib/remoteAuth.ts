export type RemoteAuthProvider = 'google' | 'apple';

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

async function getLovableSignInResult(provider: RemoteAuthProvider, opts?: SignInOptions) {
  const { lovable } = await import('@/integrations/lovable');
  return lovable.auth.signInWithOAuth(provider, {
    redirect_uri: opts?.redirect_uri,
    extraParams: opts?.extraParams,
  });
}

export async function signInWithRemoteProvider(provider: RemoteAuthProvider, opts?: SignInOptions) {
  return getLovableSignInResult(provider, opts);
}

export function isLocalFirst(): boolean {
  return import.meta.env.VITE_LOCAL_FIRST === 'true';
}

export async function signInWithLocalPreferredProvider() {
  if (typeof window === 'undefined') return { redirected: true };
  const desktop = window.shadowtalkDesktop;
  if (desktop?.preferredLogin) {
    return desktop.preferredLogin();
  }

  return {
    redirected: true,
    error: new Error(
      'Local-first preferred login is not available in this context. Provide a `shadowtalkDesktop.preferredLogin` handler, or disable local-first mode.',
    ),
  };
}

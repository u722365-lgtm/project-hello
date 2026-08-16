/**
 * Firebase Auth → Supabase-style auth surface.
 * Keeps the app's existing `backend.auth.*` call sites working unchanged.
 */
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously as fbSignInAnonymously,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as fbSignOut,
  updateEmail,
  updatePassword,
  updateProfile,
  type User as FbUser,
} from 'firebase/auth';
import { fbAuth } from './app';

export interface AdapterUser {
  id: string;
  email: string | null;
  is_anonymous: boolean;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}

export interface AdapterSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user: AdapterUser;
}

function friendlyError(err: any): Error {
  const code: string = err?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again in a few minutes.',
    'auth/operation-not-allowed':
      'This sign-in method is not enabled for the project yet.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  };
  const e = new Error(map[code] || err?.message || 'Authentication failed.');
  (e as any).code = code;
  (e as any).status = code ? 400 : 500;
  return e;
}

export function toAdapterUser(u: FbUser | null): AdapterUser | null {
  if (!u) return null;
  return {
    id: u.uid,
    email: u.email,
    is_anonymous: u.isAnonymous,
    app_metadata: { provider: u.providerData?.[0]?.providerId || 'password' },
    user_metadata: {
      email: u.email,
      display_name: u.displayName || undefined,
      avatar_url: u.photoURL || undefined,
      email_verified: u.emailVerified,
    },
    aud: 'authenticated',
    created_at: u.metadata?.creationTime
      ? new Date(u.metadata.creationTime).toISOString()
      : new Date().toISOString(),
  };
}

async function toAdapterSession(u: FbUser | null): Promise<AdapterSession | null> {
  if (!u) return null;
  let token = '';
  try {
    token = await u.getIdToken();
  } catch {
    /* offline */
  }
  return {
    access_token: token,
    refresh_token: u.refreshToken || '',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: toAdapterUser(u)!,
  };
}

/** Wait for the first auth state resolution so getSession() is reliable on boot. */
function currentUser(): Promise<FbUser | null> {
  const auth = fbAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        unsub();
        resolve(u);
      },
      () => {
        unsub();
        resolve(null);
      },
    );
  });
}

export function createAuthAdapter() {
  return {
    async getSession() {
      try {
        const session = await toAdapterSession(await currentUser());
        return { data: { session }, error: null };
      } catch (error: any) {
        return { data: { session: null }, error: friendlyError(error) };
      }
    },

    async getUser() {
      try {
        const user = toAdapterUser(await currentUser());
        return { data: { user }, error: null };
      } catch (error: any) {
        return { data: { user: null }, error: friendlyError(error) };
      }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const cred = await signInWithEmailAndPassword(fbAuth(), email, password);
        return {
          data: { user: toAdapterUser(cred.user), session: await toAdapterSession(cred.user) },
          error: null,
        };
      } catch (error: any) {
        return { data: { user: null, session: null }, error: friendlyError(error) };
      }
    },

    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: Record<string, any>; emailRedirectTo?: string };
    }) {
      try {
        const cred = await createUserWithEmailAndPassword(fbAuth(), email, password);
        const displayName = options?.data?.display_name || options?.data?.full_name;
        if (displayName) {
          try {
            await updateProfile(cred.user, { displayName });
          } catch {
            /* non-fatal */
          }
        }
        return {
          data: { user: toAdapterUser(cred.user), session: await toAdapterSession(cred.user) },
          error: null,
        };
      } catch (error: any) {
        return { data: { user: null, session: null }, error: friendlyError(error) };
      }
    },

    async signInAnonymously() {
      try {
        const cred = await fbSignInAnonymously(fbAuth());
        return {
          data: { user: toAdapterUser(cred.user), session: await toAdapterSession(cred.user) },
          error: null,
        };
      } catch (error: any) {
        return { data: { user: null, session: null }, error: friendlyError(error) };
      }
    },

    async signInWithOAuth({
      provider,
    }: {
      provider: string;
      options?: { redirectTo?: string; queryParams?: Record<string, string>; scopes?: string };
    }) {
      try {
        let p: GoogleAuthProvider | OAuthProvider;
        if (provider === 'google') {
          p = new GoogleAuthProvider();
        } else if (provider === 'apple') {
          p = new OAuthProvider('apple.com');
          p.addScope('email');
          p.addScope('name');
        } else {
          p = new OAuthProvider(provider.includes('.') ? provider : `${provider}.com`);
        }
        await signInWithRedirect(fbAuth(), p as any);
        return { data: { provider, url: window.location.href }, error: null };
      } catch (error: any) {
        return { data: { provider, url: '' }, error: friendlyError(error) };
      }
    },

    async signOut() {
      try {
        await fbSignOut(fbAuth());
        return { error: null };
      } catch (error: any) {
        return { error: friendlyError(error) };
      }
    },

    async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }) {
      try {
        await sendPasswordResetEmail(fbAuth(), email);
        return { data: {}, error: null };
      } catch (error: any) {
        return { data: null, error: friendlyError(error) };
      }
    },

    async updateUser(attrs: { email?: string; password?: string; data?: Record<string, any> }) {
      const user = fbAuth().currentUser;
      if (!user) return { data: { user: null }, error: new Error('Not signed in') };
      try {
        if (attrs.email) await updateEmail(user, attrs.email);
        if (attrs.password) await updatePassword(user, attrs.password);
        if (attrs.data) {
          await updateProfile(user, {
            displayName: attrs.data.display_name ?? attrs.data.full_name ?? user.displayName,
            photoURL: attrs.data.avatar_url ?? user.photoURL,
          });
        }
        return { data: { user: toAdapterUser(user) }, error: null };
      } catch (error: any) {
        return { data: { user: null }, error: friendlyError(error) };
      }
    },

    async setSession() {
      return { data: { session: await toAdapterSession(fbAuth().currentUser) }, error: null };
    },

    async refreshSession() {
      const user = fbAuth().currentUser;
      try {
        if (user) await user.getIdToken(true);
      } catch {
        /* ignore */
      }
      return { data: { session: await toAdapterSession(user) }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: AdapterSession | null) => void) {
      let first = true;
      const unsub = onAuthStateChanged(fbAuth(), async (u) => {
        const session = await toAdapterSession(u);
        const event = !u ? 'SIGNED_OUT' : first ? 'INITIAL_SESSION' : 'SIGNED_IN';
        first = false;
        callback(event, session);
      });
      return { data: { subscription: { unsubscribe: unsub, id: 'firebase-auth' } }, error: null };
    },

    async linkIdentity() {
      return { data: { user: null }, error: new Error('Identity linking is not available.') };
    },
    async unlinkIdentity() {
      return { data: { user: null }, error: new Error('Identity linking is not available.') };
    },

    // Firebase MFA is enrolled through its own flow; expose safe no-ops.
    mfa: {
      challenge: async () => ({ data: null, error: null }),
      enroll: async () => ({
        data: { id: '', type: 'totp', totp: { qr_code: '', secret: '', uri: '' } },
        error: null,
      }),
      listFactors: async () => ({ data: { factors: [], next_page: null }, error: null }),
      unenroll: async () => ({ data: null, error: null }),
      verify: async () => ({ data: { data: null }, error: null }),
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: 'aal1', nextLevel: 'aal1' },
        error: null,
      }),
    },
  };
}

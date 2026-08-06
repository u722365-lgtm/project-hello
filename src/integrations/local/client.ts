/**
 * ShadowTalk AI — Supabase Backend Client
 * 
 * Replaces the previous no-op stub with a real Supabase client.
 * All 200+ files that reference `backend.*` now connect to your Supabase project.
 * 
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env
 * (Also supports legacy names: VITE_API_BASE_URL / VITE_API_KEY)
 * Falls back to local-only stub if not configured.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ============================================================
// Configuration
// ============================================================

// Support both new (VITE_SUPABASE_*) and legacy (VITE_API_*) env var names
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined);

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_API_KEY as string | undefined);

const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your_anon_key')
);

// ============================================================
// Stub fallback (used when Supabase is not configured)
// ============================================================

function chainable<T = any>(result: T = {} as T): any {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (onFulfilled?: (v: any) => any, onRejected?: (e: any) => any) =>
          Promise.resolve(result).then(onFulfilled, onRejected);
      }
      if (prop === 'catch') {
        return (onRejected?: (e: any) => any) => Promise.resolve(result).catch(onRejected as any);
      }
      if (prop === 'finally') {
        return (cb?: () => void) => Promise.resolve(result).finally(cb as any);
      }
      if (prop === 'data') return (result as any)?.data ?? null;
      if (prop === 'error') return (result as any)?.error ?? null;
      if (prop === 'count') return (result as any)?.count ?? 0;
      if (typeof prop === 'symbol') return undefined;
      return (..._args: any[]) => chainable(result);
    },
    apply(_target, _thisArg, _args) {
      return chainable(result);
    },
  };
  return new Proxy(function () {}, handler);
}

const emptyData = { data: null, error: null, count: 0, status: 200, statusText: 'OK' };
const emptyArray = { data: [], error: null, count: 0, status: 200, statusText: 'OK' };
const noopPromise = <T = any>(v: T): Promise<T> => Promise.resolve(v);

const channelStub = {
  on: function() { return channelStub; },
  subscribe: function(cb?: Function) { if (cb) cb('SUBSCRIBED', {}); return { unsubscribe: () => {} }; },
  unsubscribe: () => {},
  send: () => ({ ok: true }),
  state: 'closed' as string,
};

function createStubClient(): any {
  return {
    channel: (_name?: string, _opts?: any) => channelStub,
    removeChannel: (_c?: any) => {},
    removeAllChannels: () => {},
    getChannels: () => [] as any[],
    auth: {
      getSession: () => noopPromise({ data: { session: null }, error: null }),
      getUser: () => noopPromise({ data: { user: null }, error: null }),
      signInAnonymously: () => noopPromise({ data: { session: null, user: null }, error: new Error('Not configured') }),
      signInWithPassword: () => noopPromise({ data: { session: null, user: null }, error: new Error('Not configured') }),
      signInWithOAuth: () => noopPromise({ data: { provider: '', url: '' }, error: new Error('Not configured') }),
      signUp: () => noopPromise({ data: { session: null, user: null }, error: new Error('Not configured') }),
      signOut: () => noopPromise({ error: null }),
      setSession: () => noopPromise({ data: { session: null }, error: null }),
      refreshSession: () => noopPromise({ data: { session: null }, error: null }),
      updateUser: () => noopPromise({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {}, id: '' } }, error: null }),
      linkIdentity: () => noopPromise({ data: { user: null }, error: new Error('Not available') }),
      unlinkIdentity: () => noopPromise({ data: { user: null }, error: new Error('Not available') }),
      resetPasswordForEmail: () => noopPromise({ data: {}, error: null }),
      mfa: {
        challenge: () => noopPromise({ data: null, error: null }),
        enroll: () => noopPromise({ data: { id: '', type: 'totp', totp: { qr_code: '', secret: '', uri: '' } }, error: null }),
        listFactors: () => noopPromise({ data: { factors: [], next_page: null }, error: null }),
        unenroll: () => noopPromise({ data: null, error: null }),
        verify: () => noopPromise({ data: { data: null }, error: null }),
        getAuthenticatorAssuranceLevel: () => noopPromise({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null }),
      },
    },
    from: (_table: string) => chainable(emptyArray),
    rpc: (_fn: string, _params?: any) => noopPromise({ data: null, error: null }),
    functions: {
      invoke: (_name: string, _opts?: any) => noopPromise({ data: null, error: null }),
    },
    realtime: {
      connect: () => {},
      disconnect: () => {},
      channel: () => channelStub,
      getChannels: () => [],
      removeChannel: () => {},
      setAuth: () => {},
    },
    storage: {
      from: (_bucket: string) => chainable(emptyData),
      listBuckets: () => noopPromise({ data: [], error: null }),
      getBucket: () => noopPromise({ data: null, error: null }),
      createBucket: () => noopPromise({ data: null, error: null }),
      emptyBucket: () => noopPromise({ data: null, error: null }),
      deleteBucket: () => noopPromise({ data: null, error: null }),
      upload: () => noopPromise({ data: null, error: null }),
      download: () => noopPromise({ data: new Blob(), error: null }),
      remove: () => noopPromise({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    },
  };
}

// ============================================================
// Real Supabase Client
// ============================================================

let _client: SupabaseClient<Database> | null = null;

function getOrCreateClient(): SupabaseClient<Database> {
  if (_client) return _client;

  if (!isConfigured) {
    console.warn(
      '[ShadowTalk] Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env. ' +
      'Running in local-only mode — all backend operations are no-ops.'
    );
    _client = createStubClient() as any;
    return _client;
  }

  _client = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'shadowtalk-auth-token',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    db: {
      schema: 'public',
    },
  });

  console.log('[ShadowTalk] Supabase client initialized successfully.');
  return _client;
}

// ============================================================
// Export: lazy-initialized singleton
// ============================================================

export const backend: ReturnType<typeof getOrCreateClient> = new Proxy({} as any, {
  get(_, prop) {
    const client = getOrCreateClient();
    const value = (client as any)[prop as string];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Re-export for convenience
export { isConfigured };

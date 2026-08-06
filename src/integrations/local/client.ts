/**
 * Stub ShadowTalk backend client — all operations are safe no-ops.
 * ShadowTalk backend and Lovable have been completely removed from ShadowTalk.
 * This stub exists so that 200+ files that reference `backend.*` keep compiling.
 */

function chainable<T = any>(result: T = {} as T): any {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (typeof prop === 'symbol') return undefined;
      if (
        ['select','insert','update','upsert','delete','eq','neq','gt','gte',
         'lt','lte','like','ilike','is','in','not','or','and','notIn',
         'filter','match','order','limit','single','maybeSingle','range',
         'rpc','contains','cs','cd','ov','sl','sr','nx','pg',
         'onConflict','ignoreDuplicates'].includes(prop as string)
      ) {
        return (..._args: any[]) => chainable(result);
      }
      return chainable(result);
    },
    apply(_target, _thisArg, _args) {
      return chainable(result);
    },
  };
  return new Proxy(function() {}, handler);
}

const emptyData = { data: null, error: null, count: 0, status: 200, statusText: 'OK' };
const emptyArray = { data: [], error: null, count: 0, status: 200, statusText: 'OK' };
const noopPromise = <T = any>(v: T): Promise<T> => Promise.resolve(v);

const mfaStub = {
  challenge: () => noopPromise({ data: null, error: null }),
  enroll: () => noopPromise({ data: { id: '', type: 'totp', totp: { qr_code: '', secret: '', uri: '' } }, error: null }),
  listFactors: () => noopPromise({ data: { factors: [], next_page: null }, error: null }),
  unenroll: () => noopPromise({ data: null, error: null }),
  verify: () => noopPromise({ data: { data: null }, error: null }),
  getAuthenticatorAssuranceLevel: () => noopPromise({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null }),
};

const authStub = {
  getSession: () => noopPromise({ data: { session: null }, error: null }),
  getUser: () => noopPromise({ data: { user: null }, error: null }),
  signInAnonymously: () => noopPromise({ data: { session: null, user: null }, error: new Error('Auth removed') }),
  signInWithPassword: () => noopPromise({ data: { session: null, user: null }, error: new Error('Auth removed') }),
  signInWithOAuth: () => noopPromise({ data: { provider: '', url: '' }, error: new Error('Auth removed') }),
  signUp: () => noopPromise({ data: { session: null, user: null }, error: new Error('Auth removed') }),
  signOut: () => noopPromise({ error: null }),
  setSession: () => noopPromise({ data: { session: null }, error: null }),
  refreshSession: () => noopPromise({ data: { session: null }, error: null }),
  updateUser: () => noopPromise({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {}, id: '' } }, error: null }),
  linkIdentity: () => noopPromise({ data: { user: null }, error: new Error('Not available') }),
  unlinkIdentity: () => noopPromise({ data: { user: null }, error: new Error('Not available') }),
  resetPasswordForEmail: () => noopPromise({ data: {}, error: null }),
  mfa: mfaStub,
};

const channelStub = {
  on: function() { return channelStub; },
  subscribe: function(cb?: Function) { if (cb) cb('SUBSCRIBED', {}); return { unsubscribe: () => {} }; },
  unsubscribe: () => {},
  send: () => ({ ok: true }),
  state: 'closed' as string,
};

export const backend = {
  auth: authStub,
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

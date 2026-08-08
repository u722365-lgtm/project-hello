/**
 * ShadowTalk AI — Firebase backend adapter
 *
 * Exposes the same client surface the app already uses (`backend.from(...)`,
 * `backend.auth.*`, `backend.storage.from(...)`) but backed by Firebase
 * Auth + Firestore + Cloud Storage.
 *
 * Tables map 1:1 to Firestore collections. Row ids map to document ids.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  type QueryConstraint,
  type WhereFilterOp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously as fbSignInAnonymously,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './app';

// ============================================================
// Result helpers
// ============================================================

type Result<T> = { data: T; error: any; count?: number | null; status: number; statusText: string };

const ok = <T,>(data: T, count: number | null = null): Result<T> => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: 'OK',
});

const fail = (error: unknown): Result<null> => ({
  data: null,
  error: error instanceof Error ? { message: error.message, ...error } : { message: String(error) },
  count: null,
  status: 400,
  statusText: 'Error',
});

// ============================================================
// Auth
// ============================================================

function mapUser(u: FirebaseUser | null) {
  if (!u) return null;
  return {
    id: u.uid,
    aud: 'authenticated',
    email: u.email ?? undefined,
    phone: u.phoneNumber ?? undefined,
    created_at: u.metadata.creationTime ?? new Date().toISOString(),
    last_sign_in_at: u.metadata.lastSignInTime ?? undefined,
    is_anonymous: u.isAnonymous,
    app_metadata: { provider: u.providerData[0]?.providerId ?? 'email' },
    user_metadata: {
      full_name: u.displayName ?? undefined,
      name: u.displayName ?? undefined,
      avatar_url: u.photoURL ?? undefined,
      email: u.email ?? undefined,
      email_verified: u.emailVerified,
    },
    identities: u.providerData.map((p) => ({
      id: p.uid ?? u.uid,
      user_id: u.uid,
      provider: p.providerId,
      identity_data: { email: p.email ?? undefined },
    })),
  } as any;
}

async function mapSession(u: FirebaseUser | null) {
  if (!u) return null;
  const token = await u.getIdToken();
  return {
    access_token: token,
    refresh_token: u.refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: mapUser(u),
  } as any;
}

function providerFor(name: string) {
  if (name === 'google') {
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    return p;
  }
  if (name === 'apple') {
    const p = new OAuthProvider('apple.com');
    p.addScope('email');
    p.addScope('name');
    return p;
  }
  return new OAuthProvider(`${name}.com`);
}

function waitForInitialUser(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
}

const firebaseAuth = {
  getSession: async () => {
    try {
      const u = await waitForInitialUser();
      return { data: { session: await mapSession(u) }, error: null };
    } catch (error) {
      return { data: { session: null }, error };
    }
  },
  getUser: async () => {
    try {
      const u = await waitForInitialUser();
      return { data: { user: mapUser(u) }, error: null };
    } catch (error) {
      return { data: { user: null }, error };
    }
  },
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      return { data: { user: mapUser(cred.user), session: await mapSession(cred.user) }, error: null };
    } catch (error: any) {
      return { data: { user: null, session: null }, error: { message: error?.message ?? 'Sign in failed' } };
    }
  },
  signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const name = options?.data?.full_name || options?.data?.name;
      if (name) await updateProfile(cred.user, { displayName: name });
      return { data: { user: mapUser(cred.user), session: await mapSession(cred.user) }, error: null };
    } catch (error: any) {
      return { data: { user: null, session: null }, error: { message: error?.message ?? 'Sign up failed' } };
    }
  },
  signInAnonymously: async () => {
    try {
      const cred = await fbSignInAnonymously(getFirebaseAuth());
      return { data: { user: mapUser(cred.user), session: await mapSession(cred.user) }, error: null };
    } catch (error: any) {
      return { data: { user: null, session: null }, error: { message: error?.message ?? 'Guest sign in failed' } };
    }
  },
  signInWithOAuth: async ({ provider }: { provider: string; options?: any }) => {
    try {
      const cred = await signInWithPopup(getFirebaseAuth(), providerFor(provider) as any);
      return { data: { provider, url: null, user: mapUser(cred.user) }, error: null };
    } catch (error: any) {
      return { data: { provider, url: null }, error: { message: error?.message ?? 'OAuth sign in failed' } };
    }
  },
  signOut: async () => {
    try {
      await fbSignOut(getFirebaseAuth());
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
  resetPasswordForEmail: async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      return { data: {}, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
  updateUser: async (attrs: { email?: string; password?: string; data?: any }) => {
    try {
      const u = getFirebaseAuth().currentUser;
      if (!u) throw new Error('Not signed in');
      if (attrs.email) await updateEmail(u, attrs.email);
      if (attrs.password) await updatePassword(u, attrs.password);
      if (attrs.data?.full_name || attrs.data?.name) {
        await updateProfile(u, { displayName: attrs.data.full_name ?? attrs.data.name });
      }
      if (attrs.data?.avatar_url) await updateProfile(u, { photoURL: attrs.data.avatar_url });
      return { data: { user: mapUser(u) }, error: null };
    } catch (error) {
      return { data: { user: null }, error };
    }
  },
  refreshSession: async () => {
    try {
      const u = getFirebaseAuth().currentUser;
      if (u) await u.getIdToken(true);
      return { data: { session: await mapSession(u) }, error: null };
    } catch (error) {
      return { data: { session: null }, error };
    }
  },
  setSession: async () => ({ data: { session: await mapSession(getFirebaseAuth().currentUser) }, error: null }),
  onAuthStateChange: (cb: (event: string, session: any) => void) => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (u) => {
      cb(u ? 'SIGNED_IN' : 'SIGNED_OUT', await mapSession(u));
    });
    return { data: { subscription: { unsubscribe: unsub, id: 'firebase-auth' } }, error: null };
  },
  linkIdentity: async () => ({ data: { user: null }, error: { message: 'Not supported' } }),
  unlinkIdentity: async () => ({ data: { user: null }, error: { message: 'Not supported' } }),
  mfa: {
    challenge: async () => ({ data: null, error: { message: 'MFA not enabled' } }),
    enroll: async () => ({ data: null, error: { message: 'MFA not enabled' } }),
    listFactors: async () => ({ data: { factors: [], next_page: null }, error: null }),
    unenroll: async () => ({ data: null, error: { message: 'MFA not enabled' } }),
    verify: async () => ({ data: null, error: { message: 'MFA not enabled' } }),
    getAuthenticatorAssuranceLevel: async () => ({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    }),
  },
};

// ============================================================
// Firestore query builder (Postgrest-like)
// ============================================================

const OP_MAP: Record<string, WhereFilterOp> = {
  eq: '==',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  in: 'in',
  contains: 'array-contains',
};

type Mode = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

class FirestoreQuery<T = any> implements PromiseLike<Result<any>> {
  private filters: QueryConstraint[] = [];
  private orders: QueryConstraint[] = [];
  private limitN: number | null = null;
  private mode: Mode = 'select';
  private payload: any = null;
  private singleMode: 'none' | 'single' | 'maybe' = 'none';
  private wantCount = false;

  constructor(private table: string) {}

  // --- shaping (no-ops for Firestore, kept for API parity) ---
  select(_cols?: string, opts?: { count?: string }) {
    if (opts?.count) this.wantCount = true;
    if (this.mode === 'select') this.mode = 'select';
    return this;
  }

  insert(values: any) {
    this.mode = 'insert';
    this.payload = values;
    return this;
  }

  upsert(values: any) {
    this.mode = 'upsert';
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.mode = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  // --- filters ---
  private addFilter(op: string, column: string, value: any) {
    const fbOp = OP_MAP[op];
    if (fbOp) this.filters.push(where(column, fbOp, value));
    return this;
  }

  eq(c: string, v: any) { return this.addFilter('eq', c, v); }
  neq(c: string, v: any) { return this.addFilter('neq', c, v); }
  gt(c: string, v: any) { return this.addFilter('gt', c, v); }
  gte(c: string, v: any) { return this.addFilter('gte', c, v); }
  lt(c: string, v: any) { return this.addFilter('lt', c, v); }
  lte(c: string, v: any) { return this.addFilter('lte', c, v); }
  in(c: string, v: any[]) { return this.addFilter('in', c, v); }
  contains(c: string, v: any) { return this.addFilter('contains', c, v); }
  is(c: string, v: any) { return this.addFilter('eq', c, v); }
  like(c: string, v: string) { return this.addFilter('eq', c, v.replace(/%/g, '')); }
  ilike(c: string, v: string) { return this.like(c, v); }
  not() { return this; }
  or() { return this; }
  filter(c: string, op: string, v: any) { return this.addFilter(op, c, v); }
  match(obj: Record<string, any>) {
    Object.entries(obj).forEach(([k, v]) => this.addFilter('eq', k, v));
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orders.push(orderBy(column, opts?.ascending === false ? 'desc' : 'asc'));
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.limitN = to - from + 1;
    return this;
  }

  single() {
    this.singleMode = 'single';
    this.limitN = this.limitN ?? 1;
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybe';
    this.limitN = this.limitN ?? 1;
    return this;
  }

  abortSignal() { return this; }
  returns<R>() { return this as unknown as FirestoreQuery<R>; }

  // --- execution ---
  private async fetchRows() {
    const db = getFirebaseDb();
    const constraints = [...this.filters, ...this.orders];
    if (this.limitN != null) constraints.push(fbLimit(this.limitN));
    const snap = await getDocs(query(collection(db, this.table), ...constraints));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  private async run(): Promise<Result<any>> {
    try {
      const db = getFirebaseDb();

      if (this.mode === 'insert' || this.mode === 'upsert') {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const written: any[] = [];
        for (const row of rows) {
          const id = row?.id ?? doc(collection(db, this.table)).id;
          const record = {
            ...row,
            id,
            created_at: row?.created_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _ts: serverTimestamp(),
          };
          await setDoc(doc(db, this.table, String(id)), record, { merge: this.mode === 'upsert' });
          written.push(record);
        }
        const out = Array.isArray(this.payload) ? written : written[0];
        return ok(this.singleMode === 'none' ? out : written[0]);
      }

      if (this.mode === 'update') {
        const rows = await this.fetchRows();
        for (const row of rows) {
          await updateDoc(doc(db, this.table, String(row.id)), {
            ...this.payload,
            updated_at: new Date().toISOString(),
          });
        }
        const merged = rows.map((r) => ({ ...r, ...this.payload }));
        return ok(this.singleMode === 'none' ? merged : (merged[0] ?? null));
      }

      if (this.mode === 'delete') {
        const rows = await this.fetchRows();
        for (const row of rows) await deleteDoc(doc(db, this.table, String(row.id)));
        return ok(this.singleMode === 'none' ? rows : (rows[0] ?? null));
      }

      // select
      const rows = await this.fetchRows();
      if (this.singleMode === 'single') {
        if (!rows.length) {
          return { data: null, error: { message: 'No rows found', code: 'PGRST116' }, count: 0, status: 406, statusText: 'Not Acceptable' };
        }
        return ok(rows[0], 1);
      }
      if (this.singleMode === 'maybe') return ok(rows[0] ?? null, rows.length);
      return ok(rows, this.wantCount ? rows.length : null);
    } catch (error) {
      return fail(error);
    }
  }

  then<R1 = Result<any>, R2 = never>(
    onFulfilled?: ((value: Result<any>) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onFulfilled, onRejected);
  }

  catch(onRejected?: (reason: any) => any) {
    return this.run().catch(onRejected);
  }

  finally(cb?: () => void) {
    return this.run().finally(cb);
  }
}

// ============================================================
// Storage
// ============================================================

function firebaseStorageBucket(bucket: string) {
  const pathFor = (p: string) => `${bucket}/${p.replace(/^\/+/, '')}`;
  return {
    upload: async (path: string, body: Blob | File | ArrayBuffer | Uint8Array, opts?: any) => {
      try {
        const r = storageRef(getFirebaseStorage(), pathFor(path));
        const data = body instanceof ArrayBuffer ? new Uint8Array(body) : body;
        await uploadBytes(r, data as any, opts?.contentType ? { contentType: opts.contentType } : undefined);
        return { data: { path, fullPath: r.fullPath }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    download: async (path: string) => {
      try {
        const url = await getDownloadURL(storageRef(getFirebaseStorage(), pathFor(path)));
        const res = await fetch(url);
        return { data: await res.blob(), error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    remove: async (paths: string[]) => {
      try {
        await Promise.all(paths.map((p) => deleteObject(storageRef(getFirebaseStorage(), pathFor(p)))));
        return { data: paths.map((p) => ({ name: p })), error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    list: async (prefix = '') => {
      try {
        const res = await listAll(storageRef(getFirebaseStorage(), pathFor(prefix)));
        return {
          data: [
            ...res.prefixes.map((p) => ({ name: p.name, id: p.fullPath })),
            ...res.items.map((i) => ({ name: i.name, id: i.fullPath })),
          ],
          error: null,
        };
      } catch (error) {
        return { data: null, error };
      }
    },
    createSignedUrl: async (path: string) => {
      try {
        const signedUrl = await getDownloadURL(storageRef(getFirebaseStorage(), pathFor(path)));
        return { data: { signedUrl, signedURL: signedUrl }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    getPublicUrl: (path: string) => {
      const { storageBucket } = { storageBucket: getFirebaseStorage().app.options.storageBucket };
      const encoded = encodeURIComponent(pathFor(path));
      return {
        data: {
          publicUrl: `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encoded}?alt=media`,
        },
      };
    },
  };
}

// ============================================================
// Realtime placeholder (Firestore listeners are used directly where needed)
// ============================================================

const channelStub: any = {
  on: () => channelStub,
  subscribe: (cb?: (status: string, err?: any) => void) => {
    cb?.('SUBSCRIBED');
    return { unsubscribe: () => {} };
  },
  unsubscribe: () => {},
  send: () => ({ ok: true }),
  track: async () => ({}),
  untrack: async () => ({}),
  presenceState: () => ({}),
  state: 'joined',
};

// ============================================================
// Client
// ============================================================

export function createFirebaseBackend(): any {
  return {
    auth: firebaseAuth,
    from: (table: string) => new FirestoreQuery(table),
    rpc: async (_fn: string, _params?: any) => ({
      data: null,
      error: { message: 'Database functions are not available on the Firebase backend.' },
    }),
    functions: {
      invoke: async (name: string, _opts?: any) => ({
        data: null,
        error: { message: `Cloud Function "${name}" is not deployed.` },
      }),
    },
    channel: () => channelStub,
    removeChannel: () => {},
    removeAllChannels: () => {},
    getChannels: () => [],
    realtime: {
      connect: () => {},
      disconnect: () => {},
      channel: () => channelStub,
      getChannels: () => [],
      removeChannel: () => {},
      setAuth: () => {},
    },
    storage: {
      from: firebaseStorageBucket,
      listBuckets: async () => ({ data: [], error: null }),
      getBucket: async () => ({ data: null, error: null }),
      createBucket: async () => ({ data: null, error: null }),
    },
  };
}

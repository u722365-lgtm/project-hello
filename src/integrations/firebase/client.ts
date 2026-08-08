/**
 * ShadowTalk AI — Firebase Secondary Backend
 * 
 * Runs alongside Supabase as a real-time, offline-first secondary backend.
 * Provides: Auth (Google/Apple/Email/Phone), Firestore, Realtime DB, Storage, FCM.
 * 
 * Requires VITE_FIREBASE_* env vars. Falls back to no-op stubs when not configured.
 */

import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  getIdToken,
  User as FbUser,
  Auth as FbAuth,
  signInWithCustomToken,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
 enableMultiTabIndexedDbPersistence,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  onDisconnect,
  goOffline,
  goOnline,
  Database as RtdbDatabase,
} from 'firebase/database';
import {
  getStorage,
  connectStorageEmulator,
  ref as storageRef,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  Storage as FbStorage,
} from 'firebase/storage';
import {
  getMessaging,
  isSupported,
  getToken,
  deleteToken,
  onMessage,
  Messaging,
} from 'firebase/messaging';

// ============================================================
// Configuration
// ============================================================

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || '',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || '',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '',
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || undefined,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('your-firebase')
);

// ============================================================
// Stub fallbacks
// ============================================================

const noopSub = { unsubscribe: () => {} };

const stubAuth = {
  currentUser: null,
  onAuthStateChanged: (_cb: Function) => noopSub,
  signInWithPopup: () => Promise.reject(new Error('Firebase not configured')),
  signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
  createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
  signOut: () => Promise.resolve(),
  sendPasswordResetEmail: () => Promise.resolve(),
  updateProfile: () => Promise.resolve(),
  getIdToken: () => Promise.resolve(''),
};

const stubFirestore = {
  // Chain-able query builder that returns empty results
  collection: () => stubCollection,
  doc: () => stubDoc,
  batch: () => ({ commit: () => Promise.resolve(), set: () => {}, update: () => {}, delete: () => {} }),
  runTransaction: () => Promise.resolve(null),
  serverTimestamp: () => new Date(),
  increment: (n: number) => n,
  arrayUnion: (...args: any[]) => args,
  arrayRemove: (...args: any[]) => args,
  Timestamp: { now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }), fromDate: (d: Date) => ({ seconds: d.getTime() / 1000, nanoseconds: 0 }) },
};

const stubQuery = {
  where: () => stubQuery,
  orderBy: () => stubQuery,
  limit: () => stubQuery,
  get: () => Promise.resolve({ docs: [], empty: true, size: 0 }),
  onSnapshot: () => noopSub,
};

const stubDoc = {
  get: () => Promise.resolve({ exists: false, data: () => null }),
  set: () => Promise.resolve(),
  update: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  onSnapshot: () => noopSub,
};

const stubCollection = {
  add: () => Promise.resolve({ id: '' }),
  get: () => Promise.resolve({ docs: [], empty: true, size: 0 }),
  doc: () => stubDoc,
  onSnapshot: () => noopSub,
};

const stubRtdb = {
  ref: () => ({
    set: () => Promise.resolve(),
    get: () => Promise.resolve({ val: () => null, exists: () => false }),
    update: () => Promise.resolve(),
    remove: () => Promise.resolve(),
    push: () => ({ key: '', set: () => Promise.resolve() }),
    onValue: () => noopSub,
    onDisconnect: () => ({ cancel: () => Promise.resolve() }),
    child: () => ({} as any),
  }),
  goOffline: () => {},
  goOnline: () => {},
};

const stubStorage = {
  ref: () => ({
    uploadBytes: () => Promise.resolve({} as any),
    uploadBytesResumable: () => ({
      on: (e: string, cb: Function) => { if (e === 'state_changed') cb({ state: 'success' }); return { cancel: () => {}, then: (r: Function) => r({ ref: {} }) }; },
    }),
    getDownloadURL: () => Promise.resolve(''),
    deleteObject: () => Promise.resolve(),
    listAll: () => Promise.resolve({ items: [], prefixes: [] }),
    child: () => ({} as any),
    put: () => Promise.resolve({} as any),
    putString: () => Promise.resolve({} as any),
    name: '',
    fullPath: '',
  }),
};

const stubMessaging = {
  getToken: () => Promise.resolve(''),
  deleteToken: () => Promise.resolve(),
  onMessage: () => noopSub,
};

// ============================================================
// Real Firebase Instances (lazy init)
// ============================================================

let _app: FirebaseApp | null = null;
let _auth: FbAuth | typeof stubAuth = stubAuth;
let _firestore: Firestore | typeof stubFirestore = stubFirestore;
let _rtdb: RtdbDatabase | typeof stubRtdb = stubRtdb;
let _storage: FbStorage | typeof stubStorage = stubStorage;
let _messaging: Messaging | typeof stubMessaging = stubMessaging;
let _initDone = false;

function initFirebase() {
  if (_initDone) return;
  _initDone = true;

  if (!isFirebaseConfigured) {
    console.warn('[ShadowTalk] Firebase not configured. Set VITE_FIREBASE_* vars in .env. Running without Firebase.');
    return;
  }

  try {
    // Don't re-initialize if already done by another import
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

    // Auth
    _auth = getAuth(_app);
    _auth.useDeviceLanguage();

    // Firestore with offline persistence
    _firestore = getFirestore(_app);
    enableMultiTabIndexedDbPersistence(_firestore).catch((err: any) => {
      if (err.code !== 'failed-precondition') {
        console.warn('[ShadowTalk] Firestore persistence error:', err.message);
      }
    });

    // Realtime Database
    _rtdb = getDatabase(_app);

    // Storage
    _storage = getStorage(_app);

    // Messaging (only in supported environments)
    isSupported().then((supported) => {
      if (supported) {
        _messaging = getMessaging(_app);
      }
    });

    console.log('[ShadowTalk] Firebase initialized successfully.');
  } catch (err) {
    console.error('[ShadowTalk] Firebase init failed:', err);
  }
}

// Auto-init on import
initFirebase();

// ============================================================
// Exports
// ============================================================

export { _auth as auth };
export { _firestore as db };
export { _rtdb as realtime };
export { _storage as storage };
export { _messaging as messaging };

// Re-export Firebase utilities for convenience
export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut as signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  getIdToken,
  // Firestore
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit as limitQuery,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
  Timestamp,
  // Realtime DB
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
  update as rtdbUpdate,
  remove as rtdbRemove,
  push as rtdbPush,
  onValue as rtdbOnValue,
  onDisconnect as rtdbOnDisconnect,
  goOffline as rtdbGoOffline,
  goOnline as rtdbGoOnline,
  // Storage
  storageRef as fbStorageRef,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  // Messaging
  getToken,
  deleteToken as deleteMessagingToken,
  onMessage,
  signInWithCustomToken,
};

// Types
export type { FbUser, FbAuth, Firestore, RtdbDatabase, FbStorage, Messaging };

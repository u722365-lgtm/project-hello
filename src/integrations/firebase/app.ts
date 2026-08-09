/**
 * ShadowTalk AI — Firebase app bootstrap
 *
 * Web config values are publishable by design (they identify the project,
 * they do not authorize access — Firestore/Storage Security Rules do that).
 * Set them in .env (see env.example).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const env = import.meta.env as Record<string, string | undefined>;

/**
 * Default ShadowTalk Firebase project — web config values are publishable
 * identifiers, not credentials. Env vars override them for other environments.
 */
const DEFAULTS = {
  apiKey: 'AIzaSyB4bkqV5WjL5apPD5pd7xfW1Z28IQSaJsk',
  authDomain: 'shadowtalk-ai-c2b36.firebaseapp.com',
  projectId: 'shadowtalk-ai-c2b36',
  storageBucket: 'shadowtalk-ai-c2b36.firebasestorage.app',
  messagingSenderId: '826283464209',
  appId: '1:826283464209:web:90528a3ea3ea69f11dc3b0',
};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULTS.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULTS.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULTS.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULTS.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULTS.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || DEFAULTS.appId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

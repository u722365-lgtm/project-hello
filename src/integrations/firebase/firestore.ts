/**
 * ShadowTalk AI — Firestore Secondary Data Store
 * 
 * Used for: real-time document sync, offline caching, collaborative features.
 * Supabase (PostgreSQL) remains the primary DB. Firestore is the fast,
 * offline-capable secondary for specific use cases.
 */

import {
  db,
  isFirebaseConfigured,
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
  limitQuery,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
} from './client';

import type { Firestore } from 'firebase/firestore';

// ============================================================
// Collection paths
// ============================================================

export const COLLECTIONS = {
  // Mirrors key Supabase tables for dual-write
  PROFILES: 'profiles',
  CHATS: 'chats',
  MESSAGES: 'messages',
  WORKSPACES: 'workspaces',
  WORKSPACE_MEMBERS: 'workspace_members',
  PRESENCES: 'presences',
  NOTIFICATIONS: 'notifications',
  USER_SETTINGS: 'user_settings',
  DAILY_USAGE: 'daily_usage',
  SHARED_ANSWERS: 'shared_answers',
  // Firestore-specific collections
   COLLABORATIVE_CURSORS: 'collaborative_cursors',
  OFFLINE_QUEUE: 'offline_queue',
  SYNC_LOG: 'sync_log',
} as const;

// ============================================================
// Generic CRUD helpers
// ============================================================

export async function fsGet<T = any>(collectionName: string, docId: string): Promise<T | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDoc(doc(db as any, collectionName, docId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  } catch (err) {
    console.warn(`[Firestore] get ${collectionName}/${docId} failed:`, err);
    return null;
  }
}

export async function fsSet(collectionName: string, docId: string, data: any, merge = true): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(doc(db as any, collectionName, docId), { ...data, updated_at: serverTimestamp() }, { merge });
    return true;
  } catch (err) {
    console.warn(`[Firestore] set ${collectionName}/${docId} failed:`, err);
    return false;
  }
}

export async function fsAdd(collectionName: string, data: any): Promise<string | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const ref = await addDoc(collection(db as any, collectionName), {
      ...data,
      created_at: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn(`[Firestore] add ${collectionName} failed:`, err);
    return null;
  }
}

export async function fsUpdate(collectionName: string, docId: string, data: any): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await updateDoc(doc(db as any, collectionName, docId), { ...data, updated_at: serverTimestamp() });
    return true;
  } catch (err) {
    console.warn(`[Firestore] update ${collectionName}/${docId} failed:`, err);
    return false;
  }
}

export async function fsDelete(collectionName: string, docId: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await deleteDoc(doc(db as any, collectionName, docId));
    return true;
  } catch (err) {
    console.warn(`[Firestore] delete ${collectionName}/${docId} failed:`, err);
    return false;
  }
}

export async function fsQuery<T = any>(collectionName: string, constraints: Array<{ field: string; op: string; value: any }>, orderByField?: string, limitCount?: number): Promise<T[]> {
  if (!isFirebaseConfigured) return [];
  try {
    let q = query(collection(db as any, collectionName));
    for (const c of constraints) {
      q = query(q, where(c.field, c.op as any, c.value));
    }
    if (orderByField) q = query(q, orderBy(orderByField, 'desc'));
    if (limitCount) q = query(q, limitQuery(limitCount));

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
  } catch (err) {
    console.warn(`[Firestore] query ${collectionName} failed:`, err);
    return [];
  }
}

/** Real-time listener on a single document */
export function fsOnDoc(collectionName: string, docId: string, callback: (data: any | null) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };
  return onSnapshot(doc(db as any, collectionName, docId), (snap) => {
 callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/** Real-time listener on a query */
export function fsOnQuery(collectionName: string, constraints: Array<{ field: string; op: string; value: any }>, callback: (docs: any[]) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };
  let q = query(collection(db as any, collectionName));
  for (const c of constraints) {
    q = query(q, where(c.field, c.op as any, c.value));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/** Batch write multiple documents atomically */
export async function fsBatchWrite(operations: Array<{ type: 'set' | 'update' | 'delete'; collection: string; docId: string; data?: any }>): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const batch = writeBatch(db as any);
    for (const op of operations) {
      const ref = doc(db as any, op.collection, op.docId);
      if (op.type === 'set') batch.set(ref, { ...op.data, updated_at: serverTimestamp() }, { merge: true });
      else if (op.type === 'update') batch.update(ref, { ...op.data, updated_at: serverTimestamp() });
      else if (op.type === 'delete') batch.delete(ref);
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.warn('[Firestore] Batch write failed:', err);
    return false;
  }
}

// ============================================================
// ShadowTalk-specific helpers
// ============================================================

/** Sync user profile to Firestore (call after Supabase auth) */
export async function syncProfileToFirestore(userId: string, profile: {
  email?: string;
  display_name?: string;
  avatar_url?: string;
  plan?: string;
  workspace_id?: string;
}) {
  return fsSet(COLLECTIONS.PROFILES, userId, profile);
}

/** Mirror a chat message to Firestore for real-time sync */
export async function mirrorMessageToFirestore(message: {
  id: string;
  chat_id: string;
  user_id: string;
  role: string;
  content: string;
  model?: string;
  tokens?: number;
}) {
  return fsSet(COLLECTIONS.MESSAGES, message.id, {
    ...message,
  created_at: serverTimestamp(),
  });
}

/** Increment daily usage counter in Firestore */
export async function incrementFirestoreUsage(userId: string, field: 'messages' | 'images' | 'deep_research' | 'voice_minutes') {
  const today = new Date().toISOString().split('T')[0];
  const docId = `${userId}_${today}`;
  return fsUpdate(COLLECTIONS.DAILY_USAGE, docId, {
    user_id: userId,
    usage_date: today,
    [field]: increment(1),
  } as any);
}

// Re-export Timestamp for use in queries
export { serverTimestamp, increment, Timestamp };
export { arrayUnion, arrayRemove } from 'firebase/firestore';

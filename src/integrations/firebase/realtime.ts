/**
 * ShadowTalk AI — Firebase Realtime Database Integration
 * 
 * Used for: presence (online/offline/typing), collaborative cursors,
 * live notifications, and ephemeral state that doesn't need persistence.
 */

import {
  realtime,
  isFirebaseConfigured,
  rtdbRef,
  rtdbSet,
  rtdbGet,
  rtdbUpdate,
  rtdbRemove,
  rtdbOnValue,
  rtdbOnDisconnect,
  rtdbGoOffline,
  rtdbGoOnline,
} from './client';

// ============================================================
// Presence System
// ============================================================

interface PresenceState {
  uid: string;
  email?: string;
  display_name?: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  last_seen: number;
  current_page?: string;
  workspace_id?: string;
  is_typing?: boolean;
}

/** Set user as online and configure disconnect cleanup */
export async function setOnlinePresence(userId: string, info: Omit<PresenceState, 'status' | 'last_seen'>) {
  if (!isFirebaseConfigured) return;

  try {
    const userRef = rtdbRef(realtime as any, `presence/${userId}`);
    const presenceData: PresenceState = {
      ...info,
      status: 'online',
      last_seen: Date.now(),
    };

    await rtdbSet(userRef, presenceData);

    // Set up disconnect — mark as offline when connection drops
    const disconnectRef = rtdbOnDisconnect(userRef);
    disconnectRef.set({ ...presenceData, status: 'offline', last_seen: Date.now() });
    disconnectRef.cancel();
  } catch (err) {
    console.warn('[RTDB] Presence set failed:', err);
  }
}

/** Update presence status (typing, page change, etc.) */
export async function updatePresenceStatus(userId: string, updates: Partial<PresenceState>) {
  if (!isFirebaseConfigured) return;
  try {
    await rtdbUpdate(rtdbRef(realtime as any, `presence/${userId}`), {
      ...updates,
      last_seen: Date.now(),
    });
  } catch (err) {
    console.warn('[RTDB] Presence update failed:', err);
  }
}

/** Go offline */
export async function goOfflinePresence(userId: string) {
  if (!isFirebaseConfigured) return;
  try {
    await rtdbUpdate(rtdbRef(realtime as any, `presence/${userId}`), {
      status: 'offline',
      last_seen: Date.now(),
    });
    rtdbRemove(rtdbRef(realtime as any, `presence/${userId}`));
  } catch (err) {
    console.warn('[RTDB] Go offline failed:', err);
  }
}

/** Listen to workspace members' presence */
export function onWorkspacePresence(workspaceId: string, callback: (users: PresenceState[]) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };

  return rtdbOnValue(rtdbRef(realtime as any, `workspace_presence/${workspaceId}`), (snap: any) => {
    const data = snap.val();
    if (!data) {
      callback([]);
      return;
    }
    // Firebase returns an object keyed by uid
    const users = Object.values(data) as PresenceState[];
    // Filter out stale entries (> 2 min old)
    const cutoff = Date.now() - 120_000;
    callback(users.filter(u => u.last_seen > cutoff));
  });
}

// ============================================================
// Typing Indicators
// ============================================================

export async function setTyping(chatId: string, userId: string, isTyping: boolean) {
  if (!isFirebaseConfigured) return;
  try {
    await rtdbSet(rtdbRef(realtime as any, `typing/${chatId}/${userId}`), {
      is_typing: isTyping,
      last_seen: Date.now(),
    });
    if (isTyping) {
      // Auto-clear after 3 seconds
      setTimeout(() => {
        rtdbRemove(rtdbRef(realtime as any, `typing/${chatId}/${userId}`));
      }, 3000);
    }
  } catch (err) {
    // Silently fail — typing indicators are non-critical
  }
}

export function onTypingChanged(chatId: string, callback: (userId: string, isTyping: boolean) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };

  return rtdbOnValue(rtdbRef(realtime as any, `typing/${chatId}`), (snap: any) => {
    const data = snap.val();
    if (!data) return;
    for (const [uid, state] of Object.entries(data as Record<string, any>)) {
      if ((state as any).last_seen > Date.now() - 5000) {
        callback(uid, (state as any).is_typing);
      }
    }
  });
}

// ============================================================
// Live Notifications
// ============================================================

export function onNotifications(userId: string, callback: (notification: any) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };

  return rtdbOnValue(rtdbRef(realtime as any, `notifications/${userId}`), (snap: any) => {
    const data = snap.val();
    if (!data) return;
    // Process latest notification
    const entries = Object.entries(data as Record<string, any>);
    if (entries.length > 0) {
      const [id, n] = entries[entries.length - 1];
      callback({ id, ...n });
    }
  });
}

export async function clearNotification(userId: string, notificationId: string) {
  if (!isFirebaseConfigured) return;
  try {
    await rtdbRemove(rtdbRef(realtime as any, `notifications/${userId}/${notificationId}`));
  } catch (err) {
    console.warn('[RTDB] Clear notification failed:', err);
  }
}

// ============================================================
// Collaborative Cursors (for shared documents/editors)
// ============================================================

export interface CursorPosition {
  userId: string;
  displayName: string;
  color: string;
  line: number;
  column: number;
  timestamp: number;
}

export async function updateCursor(sessionId: string, cursor: Omit<CursorPosition, 'timestamp'>) {
  if (!isFirebaseConfigured) return;
  try {
    await rtdbSet(rtdbRef(realtime as any, `cursors/${sessionId}/${cursor.userId}`), {
      ...cursor,
      timestamp: Date.now(),
    });
  } catch (err) {
    // Non-critical
  }
}

export function onCursorsChanged(sessionId: string, callback: (cursors: CursorPosition[]) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };

  return rtdbOnValue(rtdbRef(realtime as any, `cursors/${sessionId}`), (snap: any) => {
    const data = snap.val();
    if (!data) { callback([]); return; }
    const cursors = Object.values(data) as CursorPosition[];
    // Filter stale cursors (> 10s old)
    callback(cursors.filter(c => c.timestamp > Date.now() - 10_000));
  });
}

// ============================================================
// Ephemeral State (room locks, feature flags, etc.)
// ============================================================

export async function setEphemeralState(path: string, value: any) {
  if (!isFirebaseConfigured) return;
  try {
    await rtdbSet(rtdbRef(realtime as any, `ephemeral/${path}`), value);
  } catch (err) {
    console.warn(`[RTDB] Set ephemeral ${path} failed:`, err);
  }
}

export async function getEphemeralState<T = any>(path: string): Promise<T | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await rtdbGet(rtdbRef(realtime as any, `ephemeral/${path}`));
    return snap.val() as T;
  } catch (err) {
    return null;
  }
}

export function onEphemeralStateChanged<T = any>(path: string, callback: (value: T | null) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };
  return rtdbOnValue(rtdbRef(realtime as any, `ephemeral/${path}`), (snap: any) => {
    callback(snap.val() as T);
  });
}

// ============================================================
// Connection management
// ============================================================

export function goOfflineRTDB() {
  if (!isFirebaseConfigured) return;
  rtdbGoOffline(realtime as any);
}

export function goOnlineRTDB() {
  if (!isFirebaseConfigured) return;
  rtdbGoOnline(realtime as any);
}

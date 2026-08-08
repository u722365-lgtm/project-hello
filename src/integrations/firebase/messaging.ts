/**
 * ShadowTalk AI — Firebase Cloud Messaging
 * 
 * Push notifications for desktop (Electron/Tauri) and PWA.
 * Requires: FCM server key in Firebase Console + service worker for PWA.
 */

import { messaging, isFirebaseConfigured, getToken, deleteMessagingToken, onMessage } from './client';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let _currentToken: string | null = null;

/** Request notification permission and get FCM token */
export async function requestNotificationPermission(): Promise<{ granted: boolean; token?: string; error?: string }> {
  if (!isFirebaseConfigured || !VAPID_KEY) {
    return { granted: false, error: 'Firebase messaging not configured (missing VAPID_KEY)' };
  }

  try {
    // Check if messaging is supported (not in insecure contexts)
    const { isSupported } = await import('firebase/messaging');
    if (!(await isSupported())) {
      return { granted: false, error: 'Push notifications not supported in this browser' };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { granted: false, error: 'Notification permission denied' };
    }

    // Get FCM token
    const token = await getToken(messaging as any, { vapidKey: VAPID_KEY });
    _currentToken = token;

    // Save token to Supabase (for server-side pushes)
    try {
      const { backend } = await import('@/integrations/local/client');
      const { data: { user } } = await backend.auth.getUser();
      if (user) {
        await backend.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: token,
          platform: 'web',
          is_active: true,
        }, { onConflict: 'user_id,platform' });
      }
    } catch (err) {
      console.warn('[FCM] Failed to save token to Supabase:', err);
    }

    return { granted: true, token };
  } catch (err: any) {
    console.error('[FCM] Token request failed:', err);
    return { granted: false, error: err?.message || 'Failed to get push token' };
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribeNotifications(): Promise<void> {
  if (!_currentToken) return;

  try {
    await deleteMessagingToken(messaging as any);

    // Remove from Supabase
    const { backend } = await import('@/integrations/local/client');
    const { data: { user } } = await backend.auth.getUser();
    if (user) {
      await backend.from('push_subscriptions').update({ is_active: false }).eq('user_id', user.id).eq('platform', 'web');
    }

    _currentToken = null;
  } catch (err) {
    console.warn('[FCM] Unsubscribe failed:', err);
  }
}

/** Listen for foreground push messages */
export function onForegroundMessage(callback: (payload: { title: string; body: string; data?: any; clickAction?: string }) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };

  return onMessage(messaging as any, (payload) => {
    const notification = payload.notification || {};
    callback({
      title: (notification as any).title || 'ShadowTalk',
      body: (notification as any).body || '',
      data: payload.data,
      clickAction: (notification as any).click_action,
    });
  });
}

/** Show a browser notification from a push payload */
export async function showNotification(payload: { title: string; body: string; icon?: string; clickAction?: string }) {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { clickAction: payload.clickAction },
    });
  } catch (err) {
    console.warn('[FCM] showNotification failed:', err);
  }
}

/** Register the service worker for background push */
export async function registerPushServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  } catch (err) {
    console.warn('[FCM] Service worker registration failed:', err);
  }
}

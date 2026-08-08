/**
 * ShadowTalk AI — Firebase Integration
 * 
 * Barrel export for the entire Firebase secondary backend.
 * Import from '@/integrations/firebase' to access anything.
 */

// Client (includes auth, db, realtime, storage, messaging instances)
export { isFirebaseConfigured } from './client';
export type { FbUser, Firestore, RtdbDatabase, FbStorage, Messaging } from './client';

// Auth
export {
  firebaseOAuthSignIn,
  firebaseEmailSignIn,
  firebaseCustomTokenSignIn,
  firebaseSignOut,
  firebasePasswordReset,
  firebaseUpdateProfile,
  getFirebaseIdToken,
  onFirebaseAuthChange,
  initPhoneAuth,
  sendPhoneOtp,
  verifyPhoneOtp,
} from './auth';
export type { FirebaseAuthProvider, FirebaseAuthResult } from './auth';

// Firestore
export {
  fsGet,
  fsSet,
  fsAdd,
  fsUpdate,
  fsDelete,
  fsQuery,
  fsOnDoc,
  fsOnQuery,
  fsBatchWrite,
  syncProfileToFirestore,
  mirrorMessageToFirestore,
  incrementFirestoreUsage,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from './firestore';
export { COLLECTIONS } from './firestore';

// Realtime Database
export {
  setOnlinePresence,
  updatePresenceStatus,
  goOfflinePresence,
  onWorkspacePresence,
  setTyping,
  onTypingChanged,
  onNotifications,
  clearNotification,
  updateCursor,
  onCursorsChanged,
  setEphemeralState,
  getEphemeralState,
  onEphemeralStateChanged,
  goOfflineRTDB,
  goOnlineRTDB,
} from './realtime';
export type { PresenceState, CursorPosition } from './realtime';

// Storage
export {
  uploadFile,
  uploadFileResumable,
  getPublicUrl,
  deleteFile,
  listFiles,
  STORAGE_PATHS,
} from './storage';
export type { UploadResult } from './storage';

// Cloud Messaging
export {
  requestNotificationPermission,
  unsubscribeNotifications,
  onForegroundMessage,
  showNotification,
  registerPushServiceWorker,
} from './messaging';

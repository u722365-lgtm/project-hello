/**
 * ShadowTalk AI — Firebase Auth Integration
 * 
 * Provides: Google, Apple, Email/Password, Phone, Anonymous, and Custom Token auth.
 * Works alongside Supabase Auth — user can sign in via either provider.
 */

import {
  auth,
  isFirebaseConfigured,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  getIdToken,
  signInWithCustomToken,
} from './client';
import { GoogleAuthProvider, GithubAuthProvider, TwitterAuthProvider, OAuthProvider } from 'firebase/auth';

// ============================================================
// Provider instances
// ============================================================

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('fullName');

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

const twitterProvider = new TwitterAuthProvider();

// Generic OIDC provider for any provider
function createOIDCProvider(providerId: string): OAuthProvider {
  const p = new OAuthProvider(providerId);
  p.addScope('email');
  p.addScope('profile');
  return p;
}

// ============================================================
// Auth methods
// ============================================================

export type FirebaseAuthProvider = 'google' | 'apple' | 'github' | 'twitter' | 'email' | 'phone' | 'anonymous' | 'custom';

export interface FirebaseAuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    providerId: string;
  };
  token?: string;
  error?: string;
}

function mapUser(fbUser: any): FirebaseAuthResult['user'] {
  if (!fbUser) return undefined;
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    phoneNumber: fbUser.phoneNumber,
    providerId: fbUser.providerData[0]?.providerId || 'unknown',
  };
}

/** Sign in with OAuth popup (Google, Apple, GitHub, Twitter) */
export async function firebaseOAuthSignIn(provider: 'google' | 'apple' | 'github' | 'twitter'): Promise<FirebaseAuthResult> {
  if (!isFirebaseConfigured) return { success: false, error: 'Firebase not configured' };

  try {
    const providers: Record<string, any> = {
      google: googleProvider,
      apple: appleProvider,
      github: githubProvider,
      twitter: twitterProvider,
    };

    const result = await signInWithPopup(auth as any, providers[provider]);
    const token = await getIdToken(result.user, false);

    return {
      success: true,
      user: mapUser(result.user),
      token,
    };
  } catch (err: any) {
    // User cancelled popup — don't treat as error
    if (err?.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Popup closed' };
    }
    console.error(`[Firebase Auth] ${provider} sign-in failed:`, err);
    return { success: false, error: err?.message || `${provider} sign-in failed` };
  }
}

/** Sign in / sign up with email and password */
export async function firebaseEmailSignIn(email: string, password: string, isSignUp = false): Promise<FirebaseAuthResult> {
  if (!isFirebaseConfigured) return { success: false, error: 'Firebase not configured' };

  try {
    const fn = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
    const result = await fn(auth as any, email, password);
    const token = await getIdToken(result.user, false);

    return {
      success: true,
      user: mapUser(result.user),
      token,
    };
  } catch (err: any) {
    console.error('[Firebase Auth] Email auth failed:', err);
    return { success: false, error: mapAuthError(err) };
  }
}

/** Sign in with a custom token (e.g., from Supabase → Firebase link) */
export async function firebaseCustomTokenSignIn(token: string): Promise<FirebaseAuthResult> {
  if (!isFirebaseConfigured) return { success: false, error: 'Firebase not configured' };

  try {
    const result = await signInWithCustomToken(auth as any, token);
    const idToken = await getIdToken(result.user, false);

    return {
      success: true,
      user: mapUser(result.user),
      token: idToken,
    };
  } catch (err: any) {
    console.error('[Firebase Auth] Custom token sign-in failed:', err);
    return { success: false, error: err?.message || 'Custom token sign-in failed' };
  }
}

/** Sign out from Firebase */
export async function firebaseSignOut(): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await fbSignOut(auth as any);
  } catch (err) {
    console.warn('[Firebase Auth] Sign out error:', err);
  }
}

/** Send password reset email */
export async function firebasePasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured) return { success: false, error: 'Firebase not configured' };

  try {
    await sendPasswordResetEmail(auth as any, email);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

/** Update user profile (display name, photo URL) */
export async function firebaseUpdateProfile(displayName?: string, photoURL?: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await updateProfile(auth.currentUser as any, { displayName, photoURL });
  } catch (err) {
    console.warn('[Firebase Auth] Profile update error:', err);
  }
}

/** Get current Firebase ID token */
export async function getFirebaseIdToken(forceRefresh = false): Promise<string> {
  if (!isFirebaseConfigured || !auth.currentUser) return '';
  try {
    return await getIdToken(auth.currentUser, forceRefresh);
  } catch {
    return '';
  }
}

/** Listen to Firebase auth state changes */
export function onFirebaseAuthChange(callback: (user: any | null) => void) {
  if (!isFirebaseConfigured) return { unsubscribe: () => {} };
  return onAuthStateChanged(auth as any, callback);
}

// ============================================================
// Error mapping
// ============================================================

function mapAuthError(err: any): string {
  const code = err?.code || '';
  const messages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Invalid email or password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password is too weak (min 6 characters)',
    'auth/invalid-email': 'Invalid email address',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-blocked': 'Popup was blocked by the browser. Allow popups and try again.',
    'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return messages[code] || err?.message || 'Authentication failed';
}

// ============================================================
// Phone Auth (requires reCAPTCHA — separate setup)
// ============================================================

let _recaptchaVerifier: any = null;

export async function initPhoneAuth(containerId: string, invisible = false): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const { RecaptchaVerifier } = await import('firebase/auth');
    _recaptchaVerifier = new RecaptchaVerifier(auth as any, containerId, {
      size: invisible ? 'invisible' : 'normal',
      callback: () => {},
    });
    await _recaptchaVerifier.render();
    return true;
  } catch (err) {
    console.error('[Firebase Auth] reCAPTCHA init failed:', err);
    return false;
  }
}

export async function sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured || !_recaptchaVerifier) return { success: false, error: 'Phone auth not initialized' };

  try {
    const { signInWithPhoneNumber } = await import('firebase/auth');
    const confirmation = await signInWithPhoneNumber(auth as any, phoneNumber, _recaptchaVerifier);
    // Store confirmation for verifyPhoneOtp
    (window as any).__firebasePhoneConfirmation = confirmation;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

export async function verifyPhoneOtp(code: string): Promise<FirebaseAuthResult> {
  if (!isFirebaseConfigured) return { success: false, error: 'Firebase not configured' };

  try {
    const confirmation = (window as any).__firebasePhoneConfirmation as any;
    if (!confirmation?.confirm) return { success: false, error: 'No pending phone verification. Request OTP first.' };

    const result = await confirmation.confirm(code);
    const token = await getIdToken(result.user, false);
    (window as any).__firebasePhoneConfirmation = null;

    return {
      success: true,
      user: mapUser(result.user),
      token,
    };
  } catch (err: any) {
    return { success: false, error: err?.code === 'auth/invalid-verification-code' ? 'Invalid verification code' : mapAuthError(err) };
  }
}

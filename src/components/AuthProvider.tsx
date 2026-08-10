import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@/lib/backend-types';
import { backend, isConfigured } from '@/integrations/local/client';
import { isFirebaseConfigured, onFirebaseAuthChange, firebaseSignOut, setOnlinePresence, goOfflinePresence } from '@/integrations/firebase';
import { syncProfileToFirestore } from '@/integrations/firebase/firestore';
import {
  clearExplicitSignOut,
  hasExplicitSignOut,
  isAnonymousUser,
  markExplicitSignOut,
  restoreOrCreateSession,
  saveLocalUser,
} from '@/lib/persistentAuth';

type UserPlan = 'free' | 'pro' | 'premium' | 'lifetime' | 'elite' | 'enterprise';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isOffline: boolean;
  isAnonymous: boolean;
  userPlan: UserPlan;
  subscribed: boolean;
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** Convert a Supabase AuthSession into our local Session type. */
function toLocalSession(supabaseSession: any): Session | null {
  if (!supabaseSession) return null;
  return {
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token,
    token_type: supabaseSession.token_type,
    expires_in: supabaseSession.expires_in,
    expires_at: supabaseSession.expires_at,
    user: {
      id: supabaseSession.user?.id || '',
      email: supabaseSession.user?.email || null,
      is_anonymous: supabaseSession.user?.is_anonymous ?? false,
      app_metadata: supabaseSession.user?.app_metadata || {},
      user_metadata: supabaseSession.user?.user_metadata || {},
      aud: supabaseSession.user?.aud || 'authenticated',
      created_at: supabaseSession.user?.created_at || new Date().toISOString(),
    },
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const initDone = useRef(false);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
  }, []);

  const checkSubscription = useCallback(async () => {
    setSubscribed(false);
    setUserPlan('free');
    setSubscriptionEnd(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const hydrate = (fbSession: any) => {
      if (!mounted) return;
      const local = toLocalSession(fbSession);
      applySession(local);
      if (local?.user) {
        clearExplicitSignOut();
        saveLocalUser(local.user.email || '', local.user.id);
        void syncProfileToFirestore(local.user.id, {
          email: local.user.email || undefined,
          display_name: (local.user.user_metadata as any)?.display_name || undefined,
        });
        void setOnlinePresence(local.user.id, {
          uid: local.user.id,
          email: local.user.email || undefined,
          current_page: window.location.pathname,
        });
        void checkSubscription();
      } else {
        setUserPlan('free');
        setSubscribed(false);
        setSubscriptionEnd(null);
      }
    };

    const bootstrap = async () => {
      try {
        // Firebase Authentication is the single source of truth.
        const { data: { session: fbSession } } = await backend.auth.getSession();
        if (!mounted) return;
        hydrate(fbSession);

        const { data } = backend.auth.onAuthStateChange((_event: string, next: any) => {
          hydrate(next);
        });
        if (mounted) authSubscription = data?.subscription ?? null;
      } catch (error) {
        console.warn('[Auth] Firebase session bootstrap failed:', error);
        if (mounted) {
          applySession(null);
          setUserPlan('free');
          setSubscribed(false);
          setSubscriptionEnd(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          initDone.current = true;
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, [applySession, checkSubscription]);

  const signOut = async () => {
    markExplicitSignOut();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('shadowtalk-local-user');
    }
    // Clear presence before dropping the Firebase session
    const currentSession = session;
    if (currentSession?.user?.id) {
      goOfflinePresence(currentSession.user.id);
    }
    try {
      await firebaseSignOut();
    } catch (err) {
      console.warn('[Auth] Firebase signOut error:', err);
    }
    try {
      await backend.auth.signOut();
    } catch {
      /* adapter signOut is the same Firebase call — ignore duplicates */
    }
    applySession(null);
    setUserPlan('free');
    setSubscribed(false);
    setSubscriptionEnd(null);
  };


  const value = {
    user,
    session,
    loading,
    isOffline,
    isAnonymous: isAnonymousUser(session),
    userPlan,
    subscribed,
    subscriptionEnd,
    signOut,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@/lib/backend-types';
import { backend, isConfigured } from '@/integrations/local/client';
import { syncProfile } from '@/lib/authProfile';

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

/** Convert a cloud auth session into our local Session type. */
function toLocalSession(cloudSession: any): Session | null {
  if (!cloudSession) return null;
  return {
    access_token: cloudSession.access_token,
    refresh_token: cloudSession.refresh_token,
    token_type: cloudSession.token_type,
    expires_in: cloudSession.expires_in,
    expires_at: cloudSession.expires_at,
    user: {
      id: cloudSession.user?.id || '',
      email: cloudSession.user?.email || null,
      is_anonymous: cloudSession.user?.is_anonymous ?? false,
      app_metadata: cloudSession.user?.app_metadata || {},
      user_metadata: cloudSession.user?.user_metadata || {},
      aud: cloudSession.user?.aud || 'authenticated',
      created_at: cloudSession.user?.created_at || new Date().toISOString(),
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
        void syncProfile(local.user.id, {
          email: local.user.email || undefined,
          display_name: (local.user.user_metadata as any)?.display_name || undefined,
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
        // Cloud auth is the single source of truth.
        const { data: { session: cloudSession } } = await backend.auth.getSession();
        if (!mounted) return;
        if (cloudSession?.user) {
          hydrate(cloudSession);
        } else if (!hasExplicitSignOut()) {
          // Stay logged in across restarts/refreshes if user hasn't explicitly signed out
          const local = await restoreOrCreateSession();
          if (mounted && local?.user) {
            applySession(local);
          } else if (mounted) {
            hydrate(null);
          }
        } else {
          hydrate(null);
        }

        const { data } = backend.auth.onAuthStateChange((_event: string, next: any) => {
          if (!mounted) return;
          if (next?.user) {
            hydrate(next);
          } else if (hasExplicitSignOut()) {
            hydrate(null);
          }
        });
        if (mounted) authSubscription = data?.subscription ?? null;
      } catch (error) {
        console.warn('[Auth] session bootstrap failed:', error);
        if (!hasExplicitSignOut()) {
          const local = await restoreOrCreateSession();
          if (mounted && local?.user) {
            applySession(local);
            return;
          }
        }
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
    try {
      await backend.auth.signOut();
    } catch (err) {
      console.warn('[Auth] signOut error:', err);
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

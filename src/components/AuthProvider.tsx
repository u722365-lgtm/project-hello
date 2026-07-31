import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@/lib/supabase-types';
import {
  clearExplicitSignOut,
  isAnonymousUser,
  markExplicitSignOut,
  restoreOrCreateSession,
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
    // All users are free tier — no backend to check
    setSubscribed(false);
    setUserPlan('free');
    setSubscriptionEnd(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      let restored: Session | null = null;
      try {
        restored = await restoreOrCreateSession();
        if (!mounted) return;
        applySession(restored);
        if (restored?.user) {
          void checkSubscription();
        } else {
          setUserPlan('free');
          setSubscribed(false);
          setSubscriptionEnd(null);
        }
      } catch (error) {
        console.warn('[Auth] Session bootstrap failed:', error);
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
    };
  }, [applySession, checkSubscription]);

  const signOut = async () => {
    markExplicitSignOut();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('shadowtalk-local-user');
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

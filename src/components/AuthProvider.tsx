import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  clearExplicitSignOut,
  isAnonymousUser,
  markExplicitSignOut,
  refreshSessionIfNeeded,
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

  const PRODUCT_PLANS: Record<string, UserPlan> = {
    'prod_TZocSSpPddFCH1': 'pro',
    'prod_TbiuwlUUg3F17C': 'premium',
    'prod_TbhEVUPSLMSF53': 'elite',
    'prod_TbivJcOChrAcvq': 'enterprise',
  };

  const SPECIAL_ACCESS_EMAILS = ['j3451500@gmail.com', 'almadadali00@gmail.com', 'zaim98269@gmail.com', 'laibaanis345@gmail.com'];

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
  }, []);

  const checkSubscription = useCallback(async () => {
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current?.user) {
      setSubscribed(false);
      setUserPlan('free');
      setSubscriptionEnd(null);
      return;
    }

    if (SPECIAL_ACCESS_EMAILS.some(e => e.toLowerCase() === current.user.email?.toLowerCase())) {
      setSubscribed(true);
      setUserPlan('elite');
      setSubscriptionEnd(null);
      return;
    }

    if (isAnonymousUser(current)) {
      setSubscribed(false);
      setUserPlan('free');
      setSubscriptionEnd(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Subscription check error:', error);
        setSubscribed(false);
        setUserPlan('free');
        return;
      }

      if (data?.subscribed && data?.product_id) {
        const plan = PRODUCT_PLANS[data.product_id] || 'pro';
        setSubscribed(true);
        setUserPlan(plan);
        setSubscriptionEnd(data.subscription_end || null);
      } else {
        setSubscribed(false);
        setUserPlan('free');
        setSubscriptionEnd(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscribed(false);
      setUserPlan('free');
    }
  }, []);

  const checkAndAssignAdminRole = useCallback(async () => {
    // Important: some deploy environments (Lovable/Supabase) may not have this edge function
    // deployed/configured yet. Calling it can cause noisy runtime overlays even if caught.
    // Admin role assignment should be handled via Supabase migrations/policies or manual admin tooling.
    return;
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const restored = await restoreOrCreateSession();
      if (!mounted) return;
      applySession(restored);
      if (mounted) {
        setLoading(false);
        initDone.current = true;
      }
      if (restored?.user) {
        void Promise.all([checkSubscription(), checkAndAssignAdminRole()]);
      } else {
        setUserPlan('free');
        setSubscribed(false);
        setSubscriptionEnd(null);
      }
    };

    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          applySession(null);
          setUserPlan('free');
          setSubscribed(false);
          setSubscriptionEnd(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          applySession(nextSession);
          if (nextSession?.user) {
            clearExplicitSignOut();
            setTimeout(() => {
              void checkSubscription();
              void checkAndAssignAdminRole();
            }, 50);
          }
        } else {
          applySession(nextSession);
        }

        if (initDone.current) {
          setLoading(false);
        }
      },
    );

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshSessionIfNeeded();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [applySession, checkSubscription, checkAndAssignAdminRole]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      void checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signOut = async () => {
    markExplicitSignOut();
    await supabase.auth.signOut();
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

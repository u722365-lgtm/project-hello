import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@/lib/backend-types';
import { backend, isConfigured } from '@/integrations/local/client';
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

    const bootstrap = async () => {
      try {
        // If Supabase is configured, use the real auth session
        if (isConfigured) {
          const { data: { session: sbSession } } = await backend.auth.getSession();
          if (!mounted) return;

          if (sbSession) {
            const local = toLocalSession(sbSession);
            applySession(local);
            if (sbSession.user) {
              saveLocalUser(sbSession.user.email || '', sbSession.user.id);
            }
            clearExplicitSignOut();
            void checkSubscription();
          } else if (hasExplicitSignOut()) {
            applySession(null);
          } else {
            const restored = await restoreOrCreateSession();
            if (mounted) {
              applySession(restored);
              if (restored?.user) void checkSubscription();
            }
          }

          // Listen for auth state changes (login, logout, token refresh)
          const { data } = backend.auth.onAuthStateChange(
            (_event, sbSession) => {
              if (!mounted) return;
              const local = toLocalSession(sbSession);
              applySession(local);
              if (sbSession?.user) {
                saveLocalUser(sbSession.user.email || '', sbSession.user.id);
                clearExplicitSignOut();
                void checkSubscription();
              }
            }
          );
          if (mounted) {
            authSubscription = data?.subscription ?? null;
          }
        } else {
          // Local-only mode — use localStorage
          const restored = await restoreOrCreateSession();
          if (!mounted) return;
          applySession(restored);
          if (restored?.user) {
            void checkSubscription();
          } else {
            setUserPlan('free');
            setSubscribed(false);
            setSubscriptionEnd(null);
          }
        }
      } catch (error) {
        console.warn('[Auth] Session bootstrap failed:', error);
        if (mounted) {
          try {
            const restored = await restoreOrCreateSession();
            applySession(restored);
          } catch {
            applySession(null);
          }
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
    // Sign out from Supabase if configured
    if (isConfigured) {
      try {
        await backend.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Supabase signOut error:', err);
      }
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

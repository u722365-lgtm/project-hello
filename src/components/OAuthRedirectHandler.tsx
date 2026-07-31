import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isAnonymousUser } from "@/lib/persistentAuth";

/**
 * Handles post-OAuth redirection.
 *
 * After Google/Apple OAuth, the user lands on the site root with
 * #access_token=... in the URL fragment. This component:
 *
 *   1. Detects the OAuth fragment
 *   2. Waits for Supabase to parse it into a real session
 *   3. Redirects to /chatbot (or the saved return path)
 *
 * This works regardless of which page the user lands on, because it
 * watches for the auth state change rather than relying on a specific route.
 */
export function OAuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    // Check if there's an OAuth callback in the URL hash
    const hash = window.location.hash;
    const hasOAuthFragment =
      hash.includes('access_token=') ||
      hash.includes('error=') ||
      hash.includes('error_code=');

    if (!hasOAuthFragment) return;

    // Mark as handled immediately to prevent duplicate redirects
    handled.current = true;

    if (hash.includes('error=')) {
      // Let AuthPage's error handler deal with OAuth errors
      return;
    }

    console.log('[OAuthRedirect] Detected OAuth callback, waiting for session...');

    // Wait for Supabase to parse the fragment and establish the session
    let attempts = 0;
    const maxAttempts = 15;
    const checkSession = async () => {
      for (attempts = 1; attempts <= maxAttempts; attempts++) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && !isAnonymousUser(session)) {
            console.log('[OAuthRedirect] Session established, redirecting to /chatbot');
            // Clean up the URL fragment
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            navigate('/chatbot', { replace: true });
            return;
          }
        } catch (e) {
          console.warn('[OAuthRedirect] getSession error:', e);
        }
        // Wait and retry
        await new Promise(r => setTimeout(r, 300));
      }
      console.warn('[OAuthRedirect] Could not establish session from OAuth fragment');
    };

    void checkSession();
  }, [location.pathname, navigate]);

  return null;
}

export default OAuthRedirectHandler;

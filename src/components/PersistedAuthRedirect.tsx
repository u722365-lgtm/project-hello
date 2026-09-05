import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { consumeReturnPath } from "@/lib/persistentAuth";

/**
 * When a persisted session exists, send users straight to the workspace
 * (like opening Gemini while already signed into Google).
 *
 * Handles:
 *  1. User on /auth with a real (non-anonymous) session → redirect to workspace
 *  2. User on /home or / with a real session after OAuth callback → redirect to /chatbot
 *  3. Prevent redirect loops
 */
const PersistedAuthRedirect = () => {
  const { user, loading, isAnonymous } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (isAnonymous) return;
    if (!user) return;
    if (hasRedirected.current) return;

    const path = location.pathname;

    // Case 1: On the auth page with a real session → go to /chatbot
    if (path === "/auth" || path === "/auth/") {
      hasRedirected.current = true;
      navigate('/chatbot', { replace: true });
      return;
    }

    // Case 2: On home/landing pages after OAuth callback (URL had #access_token)
    // Check if there's evidence of a fresh OAuth sign-in
    const wasOAuthCallback = sessionStorage.getItem('shadowtalk_oauth_pending') === '1';
    if (wasOAuthCallback && (path === "/" || path === "/home")) {
      hasRedirected.current = true;
      sessionStorage.removeItem('shadowtalk_oauth_pending');
      navigate('/chatbot', { replace: true });
      return;
    }
  }, [user, loading, isAnonymous, location.pathname, navigate]);

  return null;
};

export default PersistedAuthRedirect;

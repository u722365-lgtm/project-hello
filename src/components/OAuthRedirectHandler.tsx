import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * OAuth redirect handler — now a no-op since OAuth has been removed.
 * If somehow an OAuth callback URL is hit, just redirect to /chatbot.
 */
export function OAuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.includes('access_token=') || hash.includes('error=')) {
      // Clean the hash and redirect to chatbot
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      navigate('/chatbot', { replace: true });
    }
  }, [navigate]);

  return null;
}

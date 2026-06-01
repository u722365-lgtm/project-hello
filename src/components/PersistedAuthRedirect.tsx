import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { consumeReturnPath, getRememberedWorkspacePath } from "@/lib/persistentAuth";

/**
 * When a persisted session exists, send users straight to the workspace
 * (like opening Gemini while already signed into Google).
 */
const PersistedAuthRedirect = () => {
  const { user, loading, isAnonymous } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;

    if (location.pathname === "/") {
      navigate(getRememberedWorkspacePath(), { replace: true });
      return;
    }

    // Let anonymous users open /auth to link Google or email; skip auto-bounce
    if (location.pathname === "/auth" && !isAnonymous) {
      navigate(consumeReturnPath(), { replace: true });
    }
  }, [user, loading, isAnonymous, location.pathname, navigate]);

  return null;
};

export default PersistedAuthRedirect;

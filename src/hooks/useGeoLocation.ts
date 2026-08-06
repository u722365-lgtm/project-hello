import { useEffect, useRef } from "react";
import { backend } from "@/integrations/local/client";
import { useAuth } from "@/components/AuthProvider";

const SESSION_KEY = "shadowtalk_session_id";

/** Off by default — prevents blank-screen overlays when edge/table is not deployed. Set VITE_ENABLE_LOCATION_TRACKING=1 to enable. */
function isLocationTrackingEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_LOCATION_TRACKING === "1";
}

const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

async function invokeTrackLocation(sessionId: string, userId: string | null): Promise<void> {
  try {
    const { error } = await backend.functions.invoke("track-location", {
      body: { sessionId, userId },
    });
    if (error) {
      console.warn("[useGeoLocation] track-location:", error.message ?? error);
    }
  } catch (err) {
    console.warn("[useGeoLocation] track-location failed (non-blocking):", err);
  }
}

export const useGeoLocation = () => {
  const { user, session } = useAuth();
  const tracked = useRef(false);
  const heartbeatInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!isLocationTrackingEnabled()) return;

    const trackLocation = async () => {
      if (tracked.current) return;
      if (!session) return;
      tracked.current = true;

      const sessionId = getOrCreateSessionId();
      await invokeTrackLocation(sessionId, user?.id ?? null);
    };

    void trackLocation();

    heartbeatInterval.current = window.setInterval(() => {
      if (!session) return;
      const sessionId = getOrCreateSessionId();
      void invokeTrackLocation(sessionId, user?.id ?? null);
    }, 5 * 60 * 1000);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [user?.id, session]);
};

export default useGeoLocation;

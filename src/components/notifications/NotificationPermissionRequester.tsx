import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const STORAGE_KEY = "shadowtalk_push_permission_prompted_v1";

/**
 * Requests browser notification permission via a real user gesture (click/tap/keydown),
 * instead of showing a nag toast on page load. Prompts at most once per device.
 */
export function NotificationPermissionRequester() {
  const { isSupported, permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    if (!isSupported) return;
    if (permission !== "default") return;

    let alreadyPrompted = false;
    try {
      alreadyPrompted = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      alreadyPrompted = false;
    }
    if (alreadyPrompted) return;

    // Avoid adding listeners if the browser already has a decided state.
    if (typeof Notification !== "undefined" && Notification.permission !== "default") return;

    const trigger = () => {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      // Silent: no "blocked/not enabled" toast — the browser prompt is the UX.
      void requestPermission({ silent: true });
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", trigger);
      window.removeEventListener("keydown", trigger);
      window.removeEventListener("touchstart", trigger);
    };

    window.addEventListener("pointerdown", trigger, { once: true, passive: true });
    window.addEventListener("keydown", trigger, { once: true, passive: true });
    window.addEventListener("touchstart", trigger, { once: true, passive: true });
    return cleanup;
  }, [isSupported, permission, requestPermission]);

  return null;
}


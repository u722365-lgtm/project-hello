import { useCallback, useRef } from "react";
import { toast } from "sonner";

const KEY = "shadowtalk_viral_moment_last";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Fires a one-per-day "share for credits" nudge on high-signal moments
 * (copy, thumbs-up, or Nth message). Uses localStorage to gate frequency.
 */
export function useViralMoment(onShareRequest?: () => void) {
  const firedThisSession = useRef(false);

  const canFire = useCallback(() => {
    if (firedThisSession.current) return false;
    try {
      const last = Number(localStorage.getItem(KEY) ?? "0");
      if (Date.now() - last < COOLDOWN_MS) return false;
    } catch {
      // ignore
    }
    return true;
  }, []);

  const fire = useCallback(
    (context: "copy" | "thumbs_up" | "message_count") => {
      if (!canFire()) return;
      firedThisSession.current = true;
      try {
        localStorage.setItem(KEY, String(Date.now()));
      } catch {
        // ignore
      }
      toast.success("Loved this answer?", {
        description: "Share ShadowTalk — you get 100 Pro credits when a friend joins.",
        duration: 8000,
        action: onShareRequest
          ? { label: "Share now", onClick: () => onShareRequest() }
          : undefined,
        // context is included in id to avoid dedupe collisions
        id: `viral-${context}`,
      });
    },
    [canFire, onShareRequest],
  );

  return { fire };
}

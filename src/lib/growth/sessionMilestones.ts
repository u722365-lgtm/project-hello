const SESSIONS_KEY = "shadowtalk_successful_sessions";
const NUDGE_DISMISSED_KEY = "shadowtalk_referral_nudge_dismissed";

export const REFERRAL_NUDGE_MIN_SESSIONS = 3;

export function getSuccessfulSessionCount(): number {
  try {
    return parseInt(localStorage.getItem(SESSIONS_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

/** Call after a completed assistant reply (non-empty, not aborted). */
export function recordSuccessfulChatSession(): number {
  const next = getSuccessfulSessionCount() + 1;
  try {
    localStorage.setItem(SESSIONS_KEY, String(next));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("shadowtalk-session-milestone"));
    }
  } catch {
    /* ignore */
  }
  return next;
}

export function shouldShowReferralNudge(): boolean {
  try {
    if (localStorage.getItem(NUDGE_DISMISSED_KEY) === "1") return false;
    return getSuccessfulSessionCount() >= REFERRAL_NUDGE_MIN_SESSIONS;
  } catch {
    return false;
  }
}

export function dismissReferralNudge(): void {
  try {
    localStorage.setItem(NUDGE_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

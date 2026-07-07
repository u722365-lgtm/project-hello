import { getSuccessfulSessionCount } from "@/lib/growth/sessionMilestones";

export const HAS_CHATTED_KEY = "shadowtalk_has_chatted";
const SESSION_ACTIVE_KEY = "shadowtalk_session_active_chat";

export function markHasChatted(): void {
  try {
    localStorage.setItem(HAS_CHATTED_KEY, "1");
    sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasChattedBefore(): boolean {
  try {
    return (
      localStorage.getItem(HAS_CHATTED_KEY) === "1" ||
      getSuccessfulSessionCount() > 0
    );
  } catch {
    return false;
  }
}

/** Returning anonymous visitors skip marketing and go straight to chat. */
export function shouldSkipLandingForReturnVisitor(): boolean {
  return hasChattedBefore();
}

export function isChatSessionActive(): boolean {
  try {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}

export function completeQuickPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return "What can ShadowTalk AI do for me? Give me a quick 30-second overview.";
  }
  if (/\b(for|about)\s*$/i.test(trimmed)) {
    return `${prompt}ShadowTalk AI and what makes it different from ChatGPT.`;
  }
  return prompt;
}

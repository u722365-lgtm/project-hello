import { recordGrowthEvent, type GrowthEvent } from "@/lib/shadowScale/growthEvents";

export type FunnelEventType = Extract<
  GrowthEvent["type"],
  | "landing_view"
  | "chatbot_view"
  | "quick_prompt"
  | "first_send_attempt"
  | "first_reply"
  | "send_blocked"
  | "send_error"
>;

const SESSION_FLAGS_KEY = "shadowtalk_funnel_flags";

function readFlags(): Record<string, boolean> {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_FLAGS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeFlags(flags: Record<string, boolean>): void {
  try {
    sessionStorage.setItem(SESSION_FLAGS_KEY, JSON.stringify(flags));
  } catch {
    /* ignore */
  }
}

/** Lightweight anonymous-safe funnel events (stored locally, drained by ShadowScale). */
export function recordFunnelEvent(type: FunnelEventType, detail?: string): void {
  recordGrowthEvent(type, detail);

  const flags = readFlags();
  if (type === "first_send_attempt" && !flags.first_send) {
    flags.first_send = true;
    writeFlags(flags);
  }
  if (type === "first_reply" && !flags.first_reply) {
    flags.first_reply = true;
    writeFlags(flags);
  }
}

export function recordLandingView(path: string): void {
  recordFunnelEvent("landing_view", path);
}

export function recordChatbotView(): void {
  recordFunnelEvent("chatbot_view");
}

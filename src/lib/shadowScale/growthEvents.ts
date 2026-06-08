const EVENTS_KEY = "shadowscale_pending_events";
const MAX = 30;

export type GrowthEvent = {
  type: "share" | "referral_click" | "session_milestone" | "signup";
  detail?: string;
  at: number;
};

function read(): GrowthEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(events: GrowthEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX)));
}

export function recordGrowthEvent(type: GrowthEvent["type"], detail?: string): void {
  const events = read();
  events.push({ type, detail, at: Date.now() });
  write(events);
}

export function drainGrowthEvents(): GrowthEvent[] {
  const events = read();
  write([]);
  return events;
}

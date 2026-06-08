const ENGINE_KEY = "shadowtalk_shadow_heal_engine";
const TRAFFIC_KEY = "shadowtalk_traffic_level";
const CLIENT_ID_KEY = "shadowtalk_heal_client_id";

export type TrafficLevel = "normal" | "elevated" | "critical";

export const SHADOW_HEAL_TICK_MS = 45_000;
export const SHADOW_HEAL_HEARTBEAT_MS = 5 * 60_000;

export function isShadowHealEngineEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(ENGINE_KEY) === "off") return false;
  } catch {
    /* ignore */
  }
  return true;
}

export function getTrafficLevel(): TrafficLevel {
  try {
    const v = localStorage.getItem(TRAFFIC_KEY);
    if (v === "elevated" || v === "critical") return v;
  } catch {
    /* ignore */
  }
  return "normal";
}

export function setTrafficLevel(level: TrafficLevel): void {
  try {
    localStorage.setItem(TRAFFIC_KEY, level);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.dataset.shadowTraffic = level;
  }
}

export function getHealClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `hc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return `hc_${Date.now()}`;
  }
}

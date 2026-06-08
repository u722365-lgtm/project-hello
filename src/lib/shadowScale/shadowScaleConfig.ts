const CLIENT_ID_KEY = "shadowscale_client_id";
const ENABLED_KEY = "shadowscale_engine_enabled";

export const SHADOWSCALE_TICK_MS = 60_000;
export const SHADOWSCALE_HEARTBEAT_MS = 5 * 60_000;

export function getShadowScaleClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `ssc_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return "ssc_anon";
  }
}

export function isShadowScaleEngineEnabled(): boolean {
  try {
    if (localStorage.getItem(ENABLED_KEY) === "0") return false;
    return true;
  } catch {
    return true;
  }
}

export function setShadowScaleEngineEnabled(on: boolean): void {
  localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
}

/** User-facing autonomous agent mode (in-chat missions, proactive signals). Default: on. */

export const AUTONOMY_MODE_KEY = "shadowtalk_autonomous_mode_v1";

export function isAutonomousModeEnabled(): boolean {
  try {
    const v = localStorage.getItem(AUTONOMY_MODE_KEY);
    if (v === null) return true;
    return v === "1" || v === "true";
  } catch {
    return true;
  }
}

export function setAutonomousModeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTONOMY_MODE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

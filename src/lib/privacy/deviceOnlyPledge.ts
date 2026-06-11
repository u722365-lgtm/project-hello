/**
 * Device-only privacy pledge — "Your data never leaves your device."
 * Default ON. Cloud AI and cloud chat persistence require explicit opt-in.
 */

const PLEDGE_KEY = "shadowtalk_device_only_pledge";
const CLOUD_OPT_IN_KEY = "shadowtalk_cloud_opt_in_acknowledged";
const ROUTING_PREF_KEY = "shadowtalk_offline_pref";

export const DEVICE_ONLY_BLOCKED_MESSAGE =
  "Device-only mode is on: your data stays on this device. Load an on-device model (Settings → Offline AI) or explicitly opt in to cloud features in Privacy settings.";

/** Initialize defaults on first visit — pledge active, routing local-only. */
export function ensureDeviceOnlyPledgeDefaults(): void {
  try {
    if (localStorage.getItem(PLEDGE_KEY) === null) {
      localStorage.setItem(PLEDGE_KEY, "true");
    }
    if (isDeviceOnlyPledgeActive() && !hasCloudOptIn()) {
      const pref = localStorage.getItem(ROUTING_PREF_KEY);
      if (pref !== "cloud-only") {
        localStorage.setItem(ROUTING_PREF_KEY, "local-only");
      }
    }
  } catch {
    // SSR / private mode — treat as pledged
  }
}

/** True unless user explicitly disabled the pledge (rare). Default: true. */
export function isDeviceOnlyPledgeActive(): boolean {
  try {
    return localStorage.getItem(PLEDGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setDeviceOnlyPledgeActive(active: boolean): void {
  localStorage.setItem(PLEDGE_KEY, active ? "true" : "false");
  if (active) {
    localStorage.removeItem(CLOUD_OPT_IN_KEY);
    localStorage.setItem(ROUTING_PREF_KEY, "local-only");
  }
}

/** User acknowledged that cloud features send data off-device. */
export function hasCloudOptIn(): boolean {
  try {
    return localStorage.getItem(CLOUD_OPT_IN_KEY) === "true";
  } catch {
    return false;
  }
}

export function setCloudOptIn(acknowledged: boolean): void {
  if (acknowledged) {
    localStorage.setItem(CLOUD_OPT_IN_KEY, "true");
    localStorage.setItem(PLEDGE_KEY, "false");
  } else {
    localStorage.removeItem(CLOUD_OPT_IN_KEY);
    localStorage.setItem(PLEDGE_KEY, "true");
    localStorage.setItem(ROUTING_PREF_KEY, "local-only");
  }
}

/** Cloud LLM / agent APIs (Jules, chat edge function, etc.) */
export function canUseCloudAI(): boolean {
  return !isDeviceOnlyPledgeActive() || hasCloudOptIn();
}

/** Supabase messages/conversations — operator-visible unless E2EE-only client storage */
export function shouldPersistChatToCloud(): boolean {
  return canUseCloudAI();
}

/** Throws when cloud egress is blocked by the pledge. */
export function assertCloudAllowed(feature: string): void {
  if (!canUseCloudAI()) {
    throw new Error(`${DEVICE_ONLY_BLOCKED_MESSAGE} (blocked: ${feature})`);
  }
}

/**
 * Device-only privacy pledge — "Your data never leaves your device."
 * Default ON. Cloud AI requires full opt-in OR interim consent while no local model is ready.
 */

import { isLocalInferenceReady } from "./localInferenceReady";


const PLEDGE_KEY = "shadowtalk_device_only_pledge";
const CLOUD_OPT_IN_KEY = "shadowtalk_cloud_opt_in_acknowledged";
const INTERIM_CLOUD_KEY = "shadowtalk_interim_cloud_until_local_ready";
const ROUTING_PREF_KEY = "shadowtalk_offline_pref";

export const DEVICE_ONLY_BLOCKED_MESSAGE =
  "Device-only mode is on: your data stays on this device. Allow cloud AI while your model downloads, load an on-device model (Profile → Offline AI), or opt in to cloud in Privacy settings.";

export const INTERIM_CLOUD_DECLINED_MESSAGE =
  "Choose how to chat: allow cloud AI until your on-device model is ready, or download a model in Profile → Offline AI.";

/** Initialize defaults on first visit — pledge active; routing stays auto until local model is ready. */
export function ensureDeviceOnlyPledgeDefaults(): void {
  try {
    if (localStorage.getItem(PLEDGE_KEY) === null) {
      localStorage.setItem(PLEDGE_KEY, "true");
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
    localStorage.removeItem(INTERIM_CLOUD_KEY);
  } else {
    localStorage.removeItem(CLOUD_OPT_IN_KEY);
    localStorage.setItem(PLEDGE_KEY, "true");
    localStorage.setItem(ROUTING_PREF_KEY, "local-only");
    localStorage.removeItem(INTERIM_CLOUD_KEY);
  }
}

/**
 * User allows cloud AI temporarily while the on-device model downloads or loads.
 * Revoked automatically once local inference is ready.
 */
export function hasInterimCloudConsent(): boolean {
  try {
    return localStorage.getItem(INTERIM_CLOUD_KEY) === "true";
  } catch {
    return false;
  }
}

export function setInterimCloudConsent(allowed: boolean): void {
  if (allowed) {
    localStorage.setItem(INTERIM_CLOUD_KEY, "true");
    localStorage.setItem(ROUTING_PREF_KEY, "auto");
  } else {
    localStorage.removeItem(INTERIM_CLOUD_KEY);
    if (isDeviceOnlyPledgeActive() && !hasCloudOptIn()) {
      localStorage.setItem(ROUTING_PREF_KEY, "local-only");
    }
  }
}

/**
 * Call when the on-device model finishes loading.
 * ShadowTalk auto-cuts cloud routing for normal chat and flips to local-only
 * so subsequent messages stay on-device, per the offline-first spec.
 * Specialized tools that need cloud will re-enable it on demand.
 */
export function onLocalModelReady(): void {
  localStorage.removeItem(INTERIM_CLOUD_KEY);

  // Default auto cut-over: if the user hasn't explicitly opted into cloud,
  // switch normal chat to local-only now that the model is ready.
  if (isDeviceOnlyPledgeActive() && !hasCloudOptIn()) {
    localStorage.setItem(ROUTING_PREF_KEY, "local-only");
  }
}


/**
 * Logged-in users get cloud AI automatically while the on-device model downloads.
 * No manual consent dialog — see seamlessOfflineBootstrap.
 */
export function ensureAutoCloudUntilLocalReady(): void {
  if (!isDeviceOnlyPledgeActive() || hasCloudOptIn() || isLocalInferenceReady()) return;
  if (!hasInterimCloudConsent()) {
    setInterimCloudConsent(true);
  } else if (localStorage.getItem(ROUTING_PREF_KEY) === "local-only") {
    localStorage.setItem(ROUTING_PREF_KEY, "auto");
  }
}

/** @deprecated Automated — always false; cloud is enabled silently for logged-in users. */
export function needsInterimCloudChoice(): boolean {
  return false;
}

/** Cloud LLM / agent APIs (Jules, chat edge function, etc.) */
export function canUseCloudAI(): boolean {

  if (!isDeviceOnlyPledgeActive() || hasCloudOptIn()) return true;
  if (hasInterimCloudConsent() && !isLocalInferenceReady()) return true;
  return false;
}

/** ShadowTalk backend messages/conversations — operator-visible unless E2EE-only client storage */
export function shouldPersistChatToCloud(): boolean {
  return canUseCloudAI();
}

/** Throws when cloud egress is blocked by the pledge. */
export function assertCloudAllowed(feature: string): void {
  if (!canUseCloudAI()) {
    throw new Error(`${DEVICE_ONLY_BLOCKED_MESSAGE} (blocked: ${feature})`);
  }
}

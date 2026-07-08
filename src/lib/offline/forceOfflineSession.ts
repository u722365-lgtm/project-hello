/**
 * User-initiated offline chat session — blocks cloud egress and forces local routing.
 * Activated via Profile → Quick offline models → Configure.
 */

import { setRoutingMode } from "./hybridRouter";

export const FORCE_OFFLINE_KEY = "shadowtalk_force_offline_session";
export const ACTIVE_QUICK_MODEL_KEY = "shadowtalk_active_quick_model";
export const HEAVY_DOWNLOAD_KEY = "shadowtalk_heavy_download";

export function isForceOfflineSessionActive(): boolean {
  try {
    return localStorage.getItem(FORCE_OFFLINE_KEY) === "1";
  } catch {
    return false;
  }
}

export function getActiveQuickModelId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_QUICK_MODEL_KEY);
  } catch {
    return null;
  }
}

/** Load model in chat + disconnect from cloud (app-level air-gap). */
export function activateForceOfflineSession(modelId: string): void {
  localStorage.setItem(FORCE_OFFLINE_KEY, "1");
  localStorage.setItem(ACTIVE_QUICK_MODEL_KEY, modelId);
  localStorage.removeItem("shadowtalk_interim_cloud_until_local_ready");
  setRoutingMode("local-only");
  window.dispatchEvent(new CustomEvent("shadowtalk-offline-session-changed"));
}

export function deactivateForceOfflineSession(): void {
  localStorage.removeItem(FORCE_OFFLINE_KEY);
  localStorage.removeItem(ACTIVE_QUICK_MODEL_KEY);
  setRoutingMode("auto");
  window.dispatchEvent(new CustomEvent("shadowtalk-offline-session-changed"));
}

export function setHeavyDownloadInProgress(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(HEAVY_DOWNLOAD_KEY, "1");
    else sessionStorage.removeItem(HEAVY_DOWNLOAD_KEY);
  } catch {
    /* ignore */
  }
}

export function isHeavyDownloadInProgress(): boolean {
  try {
    return sessionStorage.getItem(HEAVY_DOWNLOAD_KEY) === "1";
  } catch {
    return false;
  }
}

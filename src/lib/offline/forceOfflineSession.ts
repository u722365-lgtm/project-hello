/**
 * Force-offline session — when active, chat runs on-device only (cloud disabled).
 */

import { setRoutingMode } from "@/lib/offline/localRuntime";

const ACTIVE_KEY = "shadowtalk_force_offline_active";
const MODEL_KEY = "shadowtalk_force_offline_model";
export const OFFLINE_SESSION_EVENT = "shadowtalk-offline-session-changed";

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFLINE_SESSION_EVENT));
}

export function isForceOfflineSessionActive(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(ACTIVE_KEY) === "1";
}

export function getActiveQuickModelId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(MODEL_KEY);
}

export function activateForceOfflineSession(modelId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ACTIVE_KEY, "1");
  localStorage.setItem(MODEL_KEY, modelId);
  setRoutingMode("local-only");
  notify();
}

export function deactivateForceOfflineSession(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(MODEL_KEY);
  setRoutingMode("auto");
  notify();
}

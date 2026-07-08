/**
 * Tier A silent install — triggered on first chat visit (no banner).
 * When the on-device model finishes loading, we automatically cut cloud
 * routing and flip ShadowTalk to local-only for normal chat.
 */

import { getSmolLMEngine } from "./smollmEngine";
import { getGemmaEngine } from "./gemmaEngine";
import { dispatchLocalModelReady } from "@/lib/privacy/localInferenceReady";

export const SILENT_TIER_A_KEY = "shadowtalk_offline_silent_install";
export const BOOTSTRAP_DONE_KEY = "shadowtalk_offline_tier_a_done";
export const BOOTSTRAP_CONSENT_KEY = "shadowtalk_offline_tier_a_consent";

/** Call after successful signup / first session */
export function enableSilentTierAInstall(): void {
  localStorage.setItem(SILENT_TIER_A_KEY, "1");
  localStorage.setItem(BOOTSTRAP_CONSENT_KEY, "1");
  localStorage.removeItem("shadowtalk_offline_tier_a_skip");
}

export function isSilentTierAEnabled(): boolean {
  return localStorage.getItem(SILENT_TIER_A_KEY) === "1";
}

/** Background download; safe to call without awaiting */
export function startSilentTierAInstall(): void {
  enableSilentTierAInstall();
  const engine = getSmolLMEngine();
  if (engine.isReady) {
    dispatchLocalModelReady();
    return;
  }
  if (engine.isLoading) return;
  if (getGemmaEngine().isLoading) return;

  engine
    .ensureLoaded()
    .then((ok) => {
      if (!ok) return;
      localStorage.setItem(BOOTSTRAP_DONE_KEY, "1");
      dispatchLocalModelReady();
      // Routing flip happens only when user taps Configure on Profile quick models.
    })
    .catch((e) => console.warn("[Tier A silent]", e));
}

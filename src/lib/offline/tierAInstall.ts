/**
 * Tier A install — the default lightweight on-device model that every user gets.
 */

import { isShadowTalkDesktop, getDesktopInfo } from "@/lib/desktopBridge";
import {
  TIER_A_MODEL_ID,
  TIER_A_SIZE_MB,
  ensureLocalModel,
  isModelCached,
  isAnyLocalModelReady,
} from "@/lib/offline/localRuntime";
import { isWebGPUSupported, isModelLoaded } from "@/lib/webllm/engine";

export const BOOTSTRAP_CONSENT_KEY = "shadowtalk_offline_tier_a_consent";
export const BOOTSTRAP_DONE_KEY = "shadowtalk_offline_tier_a_done";
const SILENT_KEY = "shadowtalk_offline_tier_a_silent";

export { TIER_A_MODEL_ID, TIER_A_SIZE_MB };

export function isSilentTierAEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SILENT_KEY) === "1";
}

export function setSilentTierAEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SILENT_KEY, enabled ? "1" : "0");
}

export async function isTierAModelCached(): Promise<boolean> {
  return isModelCached(TIER_A_MODEL_ID);
}

/** Skip the download when the platform can't run it, or already has a model. */
export async function shouldSkipTierABootstrap(): Promise<boolean> {
  if (!isWebGPUSupported()) return true;
  if (isAnyLocalModelReady()) return true;
  if (isShadowTalkDesktop()) {
    const info = await getDesktopInfo();
    if (info?.offlineModelBundled) return true;
  }
  return false;
}

export interface TierAProgress {
  progress: number;
  text: string;
}

interface LocalEngineHandle {
  readonly isReady: boolean;
  readonly loadError: string | null;
  ensureLoaded(onProgress?: (p: TierAProgress) => void): Promise<boolean>;
}

function makeEngine(modelId: string): LocalEngineHandle {
  let loadError: string | null = null;
  return {
    get isReady() {
      return isModelLoaded(modelId);
    },
    get loadError() {
      return loadError;
    },
    async ensureLoaded(onProgress) {
      loadError = null;
      const ok = await ensureLocalModel(modelId, (p) =>
        onProgress?.({ progress: p.progress, text: p.text }),
      );
      if (!ok) loadError = "Model could not be loaded on this device.";
      return ok;
    },
  };
}

const smolEngine = makeEngine(TIER_A_MODEL_ID);
const gemmaEngine = makeEngine("gemma-2b-it-q4f16_1-MLC");

export function getSmolLMEngine(): LocalEngineHandle {
  return smolEngine;
}

export function getGemmaEngine(): LocalEngineHandle {
  return gemmaEngine;
}

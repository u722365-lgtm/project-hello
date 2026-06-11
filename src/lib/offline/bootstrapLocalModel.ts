import {
  GEMMA_MODELS,
  getGemmaEngine,
  type GemmaModelKey,
} from "@/lib/offline/gemmaEngine";
import { getPreferredLocalModel } from "@/lib/offline/hybridRouter";
import { getModelStatus, requestPersistentStorage } from "@/lib/offline/opfsModelStore";
import { onLocalModelReady } from "@/lib/privacy/deviceOnlyPledge";
import { dispatchLocalModelReady } from "@/lib/privacy/localInferenceReady";

/**
 * Load a cached on-device model into memory, or resume an in-progress download.
 * Safe to call on app boot and after download completes.
 */
export async function bootstrapCachedLocalModel(): Promise<boolean> {
  const engine = getGemmaEngine();
  if (engine.isReady) return true;
  if (engine.isLoading) return false;

  const modelKey = getPreferredLocalModel() as GemmaModelKey;
  const modelMeta = GEMMA_MODELS[modelKey] ?? GEMMA_MODELS.default;
  const shouldResume = localStorage.getItem("shadowtalk_offline_autoresume") === "1";
  const cached = await getModelStatus(modelMeta.id);

  if (!shouldResume && (!cached || cached.bytes <= 0)) {
    return false;
  }

  try {
    await requestPersistentStorage();
    await engine.load(modelKey);
    if (engine.isReady) {
      localStorage.removeItem("shadowtalk_offline_autoresume");
      onLocalModelReady();
      dispatchLocalModelReady();
      return true;
    }
  } catch (e) {
    console.warn("[bootstrapLocalModel] load failed:", e);
  }
  return false;
}

/**
 * Shared WebLLM loader — validates model ids and retries fallbacks on GPU OOM.
 */

import { getWebLlmLoadChain, isKnownWebLlmModel } from "./webLlmModelCatalog";
import { requestPersistentStorage } from "./opfsModelStore";
import { probeWebGPU } from "@/lib/webgpuRuntime";
import { setHeavyDownloadInProgress } from "./forceOfflineSession";

export type WebLlmLoadProgress = {
  modelId: string;
  progress: number;
  text: string;
};

export type LoadedWebLlmEngine = {
  engine: {
    chat: { completions: { create: (opts: unknown) => AsyncIterable<unknown> } };
    unload?: () => Promise<void>;
  };
  modelId: string;
};

export async function isWebLlmModelCached(modelId: string): Promise<boolean> {
  try {
    const webllm = await import("@mlc-ai/web-llm");
    for (const id of getWebLlmLoadChain(modelId)) {
      if (await webllm.hasModelInCache(id).catch(() => false)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function loadWebLlmModel(
  primaryModelId: string,
  onProgress?: (p: WebLlmLoadProgress) => void,
): Promise<LoadedWebLlmEngine | null> {
  if (!isKnownWebLlmModel(primaryModelId)) {
    throw new Error(`Unknown WebLLM model: ${primaryModelId}`);
  }

  const chain = getWebLlmLoadChain(primaryModelId);
  setHeavyDownloadInProgress(true);

  const report = (modelId: string, progress: number, text: string) => {
    onProgress?.({ modelId, progress, text });
  };

  try {
    await requestPersistentStorage();
    const gpu = await probeWebGPU();
    report(
      primaryModelId,
      2,
      gpu.available ? "Preparing WebGPU…" : "Preparing CPU (WASM)…",
    );

    const webllm = await import("@mlc-ai/web-llm");
    let lastError: unknown;

    for (const modelId of chain) {
      try {
        const cached = await webllm.hasModelInCache(modelId).catch(() => false);
        report(
          modelId,
          cached ? 12 : 6,
          cached ? `Loading ${modelId} from cache…` : `Downloading ${modelId}…`,
        );

        const engine = await webllm.CreateMLCEngine(modelId, {
          initProgressCallback: (r: { progress: number; text: string }) => {
            report(
              modelId,
              Math.min(98, Math.round(8 + r.progress * 90)),
              r.text || "Loading weights…",
            );
          },
        });

        report(modelId, 100, "Model ready");
        return { engine: engine as unknown as LoadedWebLlmEngine["engine"], modelId };
      } catch (e) {
        lastError = e;
        console.warn(`[WebLLM] ${modelId} failed, trying fallback…`, e);
      }
    }

    throw lastError ?? new Error("All model variants failed to load");
  } finally {
    setHeavyDownloadInProgress(false);
  }
}

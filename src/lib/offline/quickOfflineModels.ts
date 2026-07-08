/**
 * Small WebLLM models — fast downloads for Profile offline setup.
 */

import { requestPersistentStorage } from "./opfsModelStore";
import { configureTransformersEnv, probeWebGPU } from "@/lib/webgpuRuntime";
import { TIER_A_MODEL_ID, getSmolLMEngine } from "./smollmEngine";
import { setHeavyDownloadInProgress } from "./forceOfflineSession";
import { mergeMessagesForTierA } from "./offlineDefaultBrain";
import { getPersonalModelSampling, getActivePersonalModel } from "@/lib/personalModel";
import type { RouterMessage } from "./hybridRouter";

export type QuickOfflineModel = {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  badge?: string;
};

export const QUICK_OFFLINE_MODELS: QuickOfflineModel[] = [
  {
    id: TIER_A_MODEL_ID,
    name: "SmolLM Nano",
    description: "Fastest download (~2 min). Default offline brain.",
    sizeMB: 130,
    badge: "Recommended",
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM Mini",
    description: "Better quality, still under 400 MB.",
    sizeMB: 360,
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k",
    name: "TinyLlama 1.1B",
    description: "Stronger chat in ~675 MB — good mid-tier pick.",
    sizeMB: 675,
  },
];

export type QuickDownloadProgress = {
  modelId: string;
  percent: number;
  message: string;
};

type Listener = (p: QuickDownloadProgress) => void;

class QuickOfflineEngine {
  private engine: {
    chat: { completions: { create: (opts: unknown) => AsyncIterable<unknown> } };
    unload?: () => Promise<void>;
  } | null = null;
  private activeModelId: string | null = null;
  private loading = false;
  private loadingModelId: string | null = null;
  private lastError: string | null = null;
  private listeners = new Set<Listener>();

  get isReady() {
    return !!this.engine && !!this.activeModelId;
  }

  get activeId() {
    return this.activeModelId;
  }

  get isLoading() {
    return this.loading;
  }

  get loadingId() {
    return this.loadingModelId;
  }

  get error() {
    return this.lastError;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(p: QuickDownloadProgress) {
    this.listeners.forEach((fn) => fn(p));
  }

  async isCached(modelId: string): Promise<boolean> {
    try {
      const webllm = await import("@mlc-ai/web-llm");
      return await webllm.hasModelInCache(modelId);
    } catch {
      return false;
    }
  }

  async download(
    modelId: string,
    onProgress?: (p: QuickDownloadProgress) => void,
  ): Promise<boolean> {
    if (modelId === TIER_A_MODEL_ID) {
      setHeavyDownloadInProgress(true);
      try {
        const ok = await getSmolLMEngine().ensureLoaded((p) => {
          const progress = {
            modelId,
            percent: Math.round(p.progress * 100),
            message: p.text,
          };
          this.emit(progress);
          onProgress?.(progress);
        });
        if (ok) {
          this.activeModelId = modelId;
          this.engine = null;
        }
        return ok;
      } finally {
        setHeavyDownloadInProgress(false);
      }
    }

    if (this.loading && this.loadingModelId === modelId) {
      return new Promise((resolve) => {
        const off = this.subscribe((p) => {
          if (p.modelId === modelId && p.percent >= 100) {
            off();
            resolve(this.activeModelId === modelId);
          }
        });
      });
    }

    this.loading = true;
    this.loadingModelId = modelId;
    this.lastError = null;
    setHeavyDownloadInProgress(true);

    const report = (percent: number, message: string) => {
      const p = { modelId, percent, message };
      this.emit(p);
      onProgress?.(p);
    };

    try {
      await requestPersistentStorage();
      await configureTransformersEnv();
      const gpu = await probeWebGPU();
      report(
        2,
        gpu.available
          ? `Preparing ${modelId} (WebGPU)…`
          : `Preparing ${modelId} (CPU)…`,
      );

      if (this.engine?.unload) {
        try {
          await this.engine.unload();
        } catch {
          /* ignore */
        }
      }
      this.engine = null;

      const webllm = await import("@mlc-ai/web-llm");
      const cached = await webllm.hasModelInCache(modelId).catch(() => false);
      report(cached ? 15 : 5, cached ? "Loading from cache…" : "Downloading weights…");

      const engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (r: { progress: number; text: string }) => {
          report(
            Math.min(95, Math.round(10 + r.progress * 85)),
            r.text || "Loading model…",
          );
        },
      });

      this.engine = engine as typeof this.engine;
      this.activeModelId = modelId;
      report(100, "Ready for offline chat");
      return true;
    } catch (e) {
      console.error("[QuickOffline]", e);
      this.lastError = e instanceof Error ? e.message : "Download failed";
      report(0, this.lastError);
      return false;
    } finally {
      this.loading = false;
      this.loadingModelId = null;
      setHeavyDownloadInProgress(false);
    }
  }

  async chat(
    messages: RouterMessage[],
    onToken?: (t: string) => void,
  ): Promise<string> {
    if (this.activeModelId === TIER_A_MODEL_ID && getSmolLMEngine().isReady) {
      return getSmolLMEngine().chat(messages, onToken);
    }
    if (!this.engine) throw new Error("Quick offline model not loaded");

    const formatted = mergeMessagesForTierA(messages);
    const sampling = getPersonalModelSampling(getActivePersonalModel());
    let full = "";
    const stream = await this.engine.chat.completions.create({
      messages: formatted,
      stream: true,
      max_tokens: sampling.maxTokens,
      temperature: sampling.temperature,
    });
    for await (const chunk of stream) {
      const c = (chunk as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta
        ?.content;
      if (c) {
        full += c;
        onToken?.(c);
      }
    }
    return full || "I couldn't generate a response offline. Try again.";
  }

  isModelReady(modelId: string): boolean {
    if (modelId === TIER_A_MODEL_ID) return getSmolLMEngine().isReady;
    return this.activeModelId === modelId && !!this.engine;
  }
}

let singleton: QuickOfflineEngine | null = null;

export function getQuickOfflineEngine(): QuickOfflineEngine {
  if (!singleton) singleton = new QuickOfflineEngine();
  return singleton;
}

export function isQuickModelActiveInChat(modelId: string): boolean {
  try {
    return localStorage.getItem("shadowtalk_active_quick_model") === modelId;
  } catch {
    return false;
  }
}

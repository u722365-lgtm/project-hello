/**
 * Small WebLLM models — fast downloads for Profile offline setup.
 */

import { getGemmaEngine } from "./gemmaEngine";
import { getSmolLMEngine, TIER_A_MODEL_ID, TIER_A_FALLBACK_MODEL_ID } from "./smollmEngine";
import { mergeMessagesForTierA } from "./offlineDefaultBrain";
import { getPersonalModelSampling, getActivePersonalModel } from "@/lib/personalModel";
import {
  QUICK_OFFLINE_MODEL_ENTRIES,
  TIER_A_MODEL_ID as CATALOG_TIER_A,
  type WebLlmModelEntry,
} from "./webLlmModelCatalog";
import { isWebLlmModelCached, loadWebLlmModel } from "./webLlmLoader";
import type { RouterMessage } from "./hybridRouter";

export type QuickOfflineModel = WebLlmModelEntry;

export const QUICK_OFFLINE_MODELS = QUICK_OFFLINE_MODEL_ENTRIES;

export type QuickDownloadProgress = {
  modelId: string;
  percent: number;
  message: string;
};

type Listener = (p: QuickDownloadProgress) => void;

function isTierAId(modelId: string): boolean {
  return modelId === CATALOG_TIER_A || modelId === TIER_A_FALLBACK_MODEL_ID;
}

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
    return !!this.activeModelId && (isTierAId(this.activeModelId) ? getSmolLMEngine().isReady : !!this.engine);
  }

  get activeId() {
    return this.activeModelId;
  }

  get isLoading() {
    return this.loading || getSmolLMEngine().isLoading;
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
    if (isTierAId(modelId)) return isTierAModelCached();
    return isWebLlmModelCached(modelId);
  }

  async download(
    modelId: string,
    onProgress?: (p: QuickDownloadProgress) => void,
  ): Promise<boolean> {
    if (isTierAId(modelId)) {
      try {
        if (getGemmaEngine().isLoading) {
          this.lastError = "Large model download in progress — wait or cancel it first.";
          return false;
        }
        const ok = await getSmolLMEngine().ensureLoaded((p) => {
          const progress = {
            modelId: CATALOG_TIER_A,
            percent: Math.round(p.progress * 100),
            message: p.text,
          };
          this.emit(progress);
          onProgress?.(progress);
        });
        if (ok) {
          this.activeModelId = getSmolLMEngine().activeModelId ?? CATALOG_TIER_A;
          this.engine = null;
          this.lastError = null;
        } else {
          this.lastError = getSmolLMEngine().loadError ?? "SmolLM download failed";
        }
        return ok;
      } catch (e) {
        this.lastError = e instanceof Error ? e.message : "Download failed";
        return false;
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

    const report = (percent: number, message: string, id = modelId) => {
      const p = { modelId: id, percent, message };
      this.emit(p);
      onProgress?.(p);
    };

    try {
      if (getGemmaEngine().isReady || getGemmaEngine().isLoading) {
        try {
          await getGemmaEngine().dispose();
        } catch {
          /* free GPU */
        }
      }
      if (getSmolLMEngine().isReady) {
        try {
          await getSmolLMEngine().dispose();
        } catch {
          /* free GPU */
        }
      }
      if (this.engine?.unload) {
        try {
          await this.engine.unload();
        } catch {
          /* ignore */
        }
      }
      this.engine = null;

      const loaded = await loadWebLlmModel(modelId, (p) => {
        report(p.progress, p.text, p.modelId);
      });
      if (!loaded) {
        this.lastError = "Model load failed";
        return false;
      }

      this.engine = loaded.engine;
      this.activeModelId = loaded.modelId;
      report(100, "Ready for offline chat", loaded.modelId);
      this.lastError = null;
      return true;
    } catch (e) {
      console.error("[QuickOffline]", e);
      this.lastError = e instanceof Error ? e.message : "Download failed";
      report(0, this.lastError);
      return false;
    } finally {
      this.loading = false;
      this.loadingModelId = null;
    }
  }

  async chat(messages: RouterMessage[], onToken?: (t: string) => void): Promise<string> {
    if (this.activeModelId && isTierAId(this.activeModelId) && getSmolLMEngine().isReady) {
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
      const c = (chunk as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
      if (c) {
        full += c;
        onToken?.(c);
      }
    }
    return full || "I couldn't generate a response offline. Try again.";
  }

  isModelReady(modelId: string): boolean {
    if (isTierAId(modelId)) return getSmolLMEngine().isReady;
    return this.activeModelId === modelId && !!this.engine;
  }

  async isModelCachedOrReady(modelId: string): Promise<boolean> {
    if (this.isModelReady(modelId)) return true;
    return this.isCached(modelId);
  }
}

async function isTierAModelCached(): Promise<boolean> {
  return isWebLlmModelCached(CATALOG_TIER_A);
}

let singleton: QuickOfflineEngine | null = null;

export function getQuickOfflineEngine(): QuickOfflineEngine {
  if (!singleton) singleton = new QuickOfflineEngine();
  return singleton;
}

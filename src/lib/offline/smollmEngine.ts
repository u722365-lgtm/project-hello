/**
 * Tier A — default on-device model for all users (SmolLM2 135M via WebLLM).
 */

import { mergeMessagesForTierA } from "./offlineDefaultBrain";
import { seedDefaultModelKnowledge } from "./seedDefaultModelKnowledge";
import { getPersonalModelSampling, getActivePersonalModel } from "@/lib/personalModel";
import {
  TIER_A_MODEL_ID,
  TIER_A_FALLBACK_MODEL_ID,
} from "./webLlmModelCatalog";
import { isWebLlmModelCached, loadWebLlmModel, type WebLlmLoadProgress } from "./webLlmLoader";

export { TIER_A_MODEL_ID, TIER_A_FALLBACK_MODEL_ID };
export const TIER_A_SIZE_MB = 130;

export type SmolLoadProgress = {
  progress: number;
  text: string;
};

type Listener = (p: SmolLoadProgress) => void;

class SmolLMEngine {
  private engine: { chat: { completions: { create: (opts: unknown) => AsyncIterable<unknown> } }; unload?: () => Promise<void> } | null = null;
  private loadedModelId: string | null = null;
  private loading = false;
  private lastLoadError: string | null = null;
  private listeners = new Set<Listener>();

  get isReady() {
    return !!this.engine;
  }

  get isLoading() {
    return this.loading;
  }

  get loadError() {
    return this.lastLoadError;
  }

  get activeModelId() {
    return this.loadedModelId;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(p: SmolLoadProgress) {
    this.listeners.forEach((fn) => fn(p));
  }

  async ensureLoaded(onProgress?: (p: SmolLoadProgress) => void): Promise<boolean> {
    if (this.engine) return true;
    if (this.loading) {
      return new Promise((resolve) => {
        const off = this.subscribe((p) => {
          if (p.progress >= 1) {
            off();
            resolve(this.isReady);
          }
        });
      });
    }

    this.loading = true;
    this.lastLoadError = null;
    const report = (p: SmolLoadProgress) => {
      this.emit(p);
      onProgress?.(p);
    };

    try {
      const loaded = await loadWebLlmModel(TIER_A_MODEL_ID, (p) => {
        report({ progress: p.progress / 100, text: p.text });
      });
      if (!loaded) {
        throw new Error("SmolLM load returned empty");
      }
      this.engine = loaded.engine;
      this.loadedModelId = loaded.modelId;
      report({ progress: 1, text: "Offline AI ready" });
      localStorage.setItem("shadowtalk_tier_a_model", loaded.modelId);
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => void seedDefaultModelKnowledge(), { timeout: 15000 });
      } else {
        setTimeout(() => void seedDefaultModelKnowledge(), 8000);
      }
      return true;
    } catch (e) {
      console.error("[SmolLM]", e);
      this.lastLoadError = e instanceof Error ? e.message : "Load failed";
      report({ progress: 0, text: this.lastLoadError });
      return false;
    } finally {
      this.loading = false;
    }
  }

  async chat(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    onToken?: (t: string) => void,
  ): Promise<string> {
    if (!this.engine) throw new Error("SmolLM not loaded");
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
    return full || "I couldn't generate a response. Try again.";
  }

  async dispose() {
    if (this.engine?.unload) {
      try {
        await this.engine.unload();
      } catch {
        /* ignore */
      }
    }
    this.engine = null;
    this.loadedModelId = null;
  }
}

let singleton: SmolLMEngine | null = null;

export function getSmolLMEngine(): SmolLMEngine {
  if (!singleton) singleton = new SmolLMEngine();
  return singleton;
}

export async function isTierAModelCached(): Promise<boolean> {
  return isWebLlmModelCached(TIER_A_MODEL_ID);
}

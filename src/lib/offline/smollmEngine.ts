/**
 * Tier A — default on-device model for all users (SmolLM2 135M via WebLLM).
 * Singleton; shared across chat bootstrap and unified local routing.
 */

import { requestPersistentStorage } from "./opfsModelStore";
import { configureTransformersEnv, probeWebGPU } from "@/lib/webgpuRuntime";
import { mergeMessagesForTierA } from "./offlineDefaultBrain";
import { seedDefaultModelKnowledge } from "./seedDefaultModelKnowledge";
import { getPersonalModelSampling, getActivePersonalModel } from "@/lib/personalModel";

export const TIER_A_MODEL_ID = "SmolLM2-135M-Instruct-q4f16_1-MLC";
export const TIER_A_SIZE_MB = 130;

export type SmolLoadProgress = {
  progress: number;
  text: string;
};

type Listener = (p: SmolLoadProgress) => void;

class SmolLMEngine {
  private engine: { chat: { completions: { create: (opts: unknown) => AsyncIterable<unknown> } } } | null =
    null;
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
      await requestPersistentStorage();
      await configureTransformersEnv();
      const gpu = await probeWebGPU();
      report({
        progress: 0.02,
        text: gpu.available
          ? `Loading offline AI (WebGPU${gpu.adapterLabel ? ` · ${gpu.adapterLabel}` : ""})…`
          : "Loading offline AI (CPU)…",
      });

      const webllm = await import("@mlc-ai/web-llm");
      const cached = await webllm.hasModelInCache(TIER_A_MODEL_ID).catch(() => false);

      report({
        progress: cached ? 0.4 : 0.1,
        text: cached ? "Starting cached model…" : `Downloading ${TIER_A_SIZE_MB}MB model…`,
      });

      const engine = await webllm.CreateMLCEngine(TIER_A_MODEL_ID, {
        initProgressCallback: (r: { progress: number; text: string }) => {
          report({
            progress: 0.1 + r.progress * 0.85,
            text: r.text || "Preparing model…",
          });
        },
      });

      this.engine = engine as unknown as typeof this.engine;
      report({ progress: 1, text: "Offline AI ready" });
      localStorage.setItem("shadowtalk_tier_a_model", TIER_A_MODEL_ID);
      void seedDefaultModelKnowledge();
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
      const c = (chunk as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta
        ?.content;
      if (c) {
        full += c;
        onToken?.(c);
      }
    }
    return full || "I couldn't generate a response. Try again.";
  }

  async dispose() {
    this.engine = null;
  }
}

let singleton: SmolLMEngine | null = null;

export function getSmolLMEngine(): SmolLMEngine {
  if (!singleton) singleton = new SmolLMEngine();
  return singleton;
}

export async function isTierAModelCached(): Promise<boolean> {
  try {
    const webllm = await import("@mlc-ai/web-llm");
    return await webllm.hasModelInCache(TIER_A_MODEL_ID);
  } catch {
    return false;
  }
}

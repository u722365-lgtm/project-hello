/**
 * Quick offline models — curated small models a user can install in one tap.
 */

import { ensureLocalModel, isModelCached } from "@/lib/offline/localRuntime";
import { isModelLoaded } from "@/lib/webllm/engine";

export interface QuickOfflineModel {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
}

export interface QuickDownloadProgress {
  modelId: string;
  progress: number;
  percent: number;
  text: string;
  message: string;
}

export const QUICK_OFFLINE_MODELS: QuickOfflineModel[] = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "SmolLM Nano (Llama 3.2 1B)",
    description: "Fastest to install. Good for quick answers and drafts.",
    sizeMB: 700,
  },
  {
    id: "qwen2.5-1.5b-instruct-q4f16_1-MLC",
    name: "Qwen 2.5 1.5B",
    description: "Strong multilingual quality for its size.",
    sizeMB: 1000,
  },
  {
    id: "gemma-2b-it-q4f16_1-MLC",
    name: "Gemma 2B",
    description: "Balanced quality and speed from Google.",
    sizeMB: 1400,
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    description: "Best offline quality — needs a capable GPU.",
    sizeMB: 1800,
  },
];

type Listener = (p: QuickDownloadProgress | null) => void;

class QuickOfflineEngine {
  private listeners = new Set<Listener>();
  error: string | null = null;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(p: QuickDownloadProgress | null) {
    this.listeners.forEach((l) => l(p));
  }

  isModelReady(modelId: string): boolean {
    return isModelLoaded(modelId);
  }

  async isCached(modelId: string): Promise<boolean> {
    return isModelCached(modelId);
  }

  async download(
    modelId: string,
    onProgress?: (p: QuickDownloadProgress | null) => void,
  ): Promise<boolean> {
    this.error = null;
    const report = (p: QuickDownloadProgress | null) => {
      onProgress?.(p);
      this.emit(p);
    };

    const ok = await ensureLocalModel(modelId, (p) =>
      report({ modelId, progress: p.progress, percent: p.progress, text: p.text, message: p.text }),
    );

    report(null);
    if (!ok) this.error = "Download failed. Check connection and available storage.";
    return ok;
  }
}

let instance: QuickOfflineEngine | null = null;

export function getQuickOfflineEngine(): QuickOfflineEngine {
  if (!instance) instance = new QuickOfflineEngine();
  return instance;
}

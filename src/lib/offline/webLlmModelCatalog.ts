/**
 * Single source of truth for @mlc-ai/web-llm model IDs shipped in prebuiltAppConfig.
 * Every id here was verified against node_modules/@mlc-ai/web-llm prebuilt catalog.
 */

export type WebLlmModelTier = "nano" | "mini" | "small" | "medium" | "large" | "xl";

export interface WebLlmModelEntry {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  /** Alternate ids to try if WebGPU init fails (OOM / device lost). */
  fallbacks: string[];
  tier: WebLlmModelTier;
  /** Shown on Profile → Quick offline models */
  quickPick?: boolean;
  /** Lower = try first in Sovereign / bunker queues */
  sovereignPriority?: number;
}

export const TIER_A_MODEL_ID = "SmolLM2-135M-Instruct-q0f16-MLC";
export const TIER_A_FALLBACK_MODEL_ID = "SmolLM2-135M-Instruct-q0f32-MLC";

export const WEBLLM_MODEL_CATALOG: WebLlmModelEntry[] = [
  {
    id: TIER_A_MODEL_ID,
    name: "SmolLM Nano",
    description: "Fastest download (~2 min). Default offline brain.",
    sizeMB: 130,
    fallbacks: [TIER_A_FALLBACK_MODEL_ID],
    tier: "nano",
    quickPick: true,
    sovereignPriority: 1,
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM Mini",
    description: "Better quality, still under 400 MB.",
    sizeMB: 360,
    fallbacks: ["SmolLM2-360M-Instruct-q0f32-MLC", "SmolLM2-360M-Instruct-q0f16-MLC"],
    tier: "mini",
    quickPick: true,
    sovereignPriority: 2,
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k",
    name: "TinyLlama 1.1B",
    description: "Stronger chat in ~675 MB — good mid-tier pick.",
    sizeMB: 675,
    fallbacks: ["TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k", "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"],
    tier: "small",
    quickPick: true,
    sovereignPriority: 3,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    description: "Quality reasoning in a compact package.",
    sizeMB: 800,
    fallbacks: ["Llama-3.2-1B-Instruct-q0f16-MLC", "Llama-3.2-1B-Instruct-q4f32_1-MLC"],
    tier: "small",
    sovereignPriority: 4,
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    name: "Gemma 2 2B",
    description: "Google compact model with strong reasoning.",
    sizeMB: 2000,
    fallbacks: ["gemma-2-2b-it-q4f32_1-MLC"],
    tier: "medium",
    sovereignPriority: 5,
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    description: "Excellent reasoning. Runs on most laptops.",
    sizeMB: 2500,
    fallbacks: ["Llama-3.2-3B-Instruct-q4f32_1-MLC"],
    tier: "large",
    sovereignPriority: 6,
  },
  {
    id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    name: "Mistral 7B",
    description: "Premium quality with multilingual support.",
    sizeMB: 5000,
    fallbacks: [],
    tier: "xl",
    sovereignPriority: 7,
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    name: "Llama 3.1 8B",
    description: "Top-tier local intelligence.",
    sizeMB: 5500,
    fallbacks: [],
    tier: "xl",
    sovereignPriority: 8,
  },
];

const byId = new Map(WEBLLM_MODEL_CATALOG.map((m) => [m.id, m]));

export function getWebLlmModelEntry(modelId: string): WebLlmModelEntry | undefined {
  return byId.get(modelId);
}

export function isKnownWebLlmModel(modelId: string): boolean {
  return byId.has(modelId);
}

/** Primary id first, then GPU/CPU fallbacks (deduped). */
export function getWebLlmLoadChain(modelId: string): string[] {
  const entry = byId.get(modelId);
  if (!entry) return [modelId];
  return [...new Set([entry.id, ...entry.fallbacks])];
}

export const QUICK_OFFLINE_MODEL_ENTRIES = WEBLLM_MODEL_CATALOG.filter((m) => m.quickPick);

export const SOVEREIGN_MODEL_ENTRIES = [...WEBLLM_MODEL_CATALOG]
  .filter((m) => m.sovereignPriority != null)
  .sort((a, b) => (a.sovereignPriority ?? 99) - (b.sovereignPriority ?? 99));

export const ALL_WEBLLM_MODEL_IDS = [
  ...new Set(WEBLLM_MODEL_CATALOG.flatMap((m) => [m.id, ...m.fallbacks])),
];

/**
 * Odysseus Cookbook-style model recommendations from hardware profile.
 * Scores VRAM/RAM/platform to suggest an Ollama model tag.
 */

import type { HardwareProfile } from "@/lib/hardwareIntelligence";

export type ModelRecommendation = {
  id: string;
  label: string;
  sizeGB: number;
  minVramGB: number;
  minRamGB: number;
  description: string;
  tier: "lite" | "balanced" | "power" | "max";
};

export const OLLAMA_MODEL_CATALOG: ModelRecommendation[] = [
  {
    id: "phi3:mini",
    label: "Phi-3 Mini",
    sizeGB: 2.2,
    minVramGB: 0,
    minRamGB: 8,
    description: "CPU-friendly. Good for laptops without GPU.",
    tier: "lite",
  },
  {
    id: "qwen2.5:3b",
    label: "Qwen 2.5 3B",
    sizeGB: 2.0,
    minVramGB: 4,
    minRamGB: 8,
    description: "Fast local chat on modest hardware.",
    tier: "lite",
  },
  {
    id: "qwen2.5:7b",
    label: "Qwen 2.5 7B",
    sizeGB: 4.7,
    minVramGB: 6,
    minRamGB: 16,
    description: "Best default for 8GB GPU desktops.",
    tier: "balanced",
  },
  {
    id: "llama3.2",
    label: "Llama 3.2",
    sizeGB: 2.0,
    minVramGB: 6,
    minRamGB: 16,
    description: "Strong general assistant from Meta.",
    tier: "balanced",
  },
  {
    id: "qwen2.5:14b",
    label: "Qwen 2.5 14B",
    sizeGB: 9.0,
    minVramGB: 12,
    minRamGB: 32,
    description: "High quality for 16GB+ VRAM rigs.",
    tier: "power",
  },
  {
    id: "deepseek-r1:7b",
    label: "DeepSeek R1 7B",
    sizeGB: 4.7,
    minVramGB: 8,
    minRamGB: 16,
    description: "Reasoning-focused model for agents.",
    tier: "power",
  },
];

export type RecommendInput = {
  profile: HardwareProfile | null;
  platform?: string;
  arch?: string;
  deviceMemoryGB?: number;
};

function estimateVramGb(profile: HardwareProfile | null): number {
  if (!profile) return 0;
  if (profile.gpuScore >= 70) return 12;
  if (profile.gpuScore >= 50) return 8;
  if (profile.gpuScore >= 28) return 6;
  if (profile.gpuScore > 0) return 4;
  return 0;
}

function estimateRamGb(input: RecommendInput): number {
  if (input.deviceMemoryGB) return input.deviceMemoryGB;
  if (typeof navigator !== "undefined" && (navigator as Navigator & { deviceMemory?: number }).deviceMemory) {
    return (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  }
  return input.profile?.cpuScore && input.profile.cpuScore >= 50 ? 16 : 8;
}

export function recommendOllamaModel(input: RecommendInput): ModelRecommendation {
  const vram = estimateVramGb(input.profile);
  const ram = estimateRamGb(input);
  const isAppleSilicon =
    input.platform === "darwin" && input.arch === "arm64";

  const scored = OLLAMA_MODEL_CATALOG.map((m) => {
    let score = 0;
    if (vram >= m.minVramGB) score += 40;
    else if (m.minVramGB === 0) score += 20;
    else score -= (m.minVramGB - vram) * 8;

    if (ram >= m.minRamGB) score += 30;
    else score -= (m.minRamGB - ram) * 5;

    if (m.tier === "balanced") score += 10;
    if (isAppleSilicon && m.id.startsWith("qwen")) score += 5;
    if (vram === 0 && m.tier === "lite") score += 15;

    return { model: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.model ?? OLLAMA_MODEL_CATALOG[2];
}

export function listCompatibleModels(input: RecommendInput): ModelRecommendation[] {
  const vram = estimateVramGb(input.profile);
  const ram = estimateRamGb(input);
  return OLLAMA_MODEL_CATALOG.filter(
    (m) => (vram >= m.minVramGB || m.minVramGB === 0) && ram >= m.minRamGB * 0.75,
  );
}

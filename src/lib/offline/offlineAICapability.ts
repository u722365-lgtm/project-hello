/**
 * Detect whether Tier A (SmolLM) bootstrap can be skipped in favor of another offline path.
 */

import { getGemmaEngine } from "@/lib/offline/gemmaEngine";
import { isAnyLocalModelReady } from "@/lib/offline/localChat";

export type OfflineAIPath = "browser" | "gemma" | "none";

export async function detectOfflineAIPath(): Promise<OfflineAIPath> {
  if (isAnyLocalModelReady()) return "browser";
  if (getGemmaEngine().isReady) return "gemma";

  return "none";
}

export async function shouldSkipTierABootstrap(): Promise<boolean> {
  const path = await detectOfflineAIPath();
  return path === "gemma" || path === "browser";
}

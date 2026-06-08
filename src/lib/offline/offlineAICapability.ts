/**
 * Detect whether Tier A (SmolLM) bootstrap can be skipped in favor of another offline path.
 */

import { getDesktopInfo, isShadowTalkDesktop } from "@/lib/desktopBridge";
import { fetchOllamaStatus } from "@/lib/desktop/ollamaInference";
import { getGemmaEngine } from "@/lib/offline/gemmaEngine";
import { isAnyLocalModelReady } from "@/lib/offline/localChat";

export type OfflineAIPath = "browser" | "ollama" | "gemma" | "none";

export async function detectOfflineAIPath(): Promise<OfflineAIPath> {
  if (isAnyLocalModelReady()) return "browser";
  if (getGemmaEngine().isReady) return "gemma";

  if (isShadowTalkDesktop()) {
    const info = await getDesktopInfo();
    if (info?.ollamaBundled || info?.ollamaReachable) return "ollama";

    const status = await fetchOllamaStatus();
    if (status?.reachable) return "ollama";
  }

  return "none";
}

export async function shouldSkipTierABootstrap(): Promise<boolean> {
  const path = await detectOfflineAIPath();
  return path === "ollama" || path === "gemma" || path === "browser";
}

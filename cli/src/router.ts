import { loadConfig } from "./config.js";
import { canUseCloudAI } from "./pledge.js";
import { probeOllamaStatus, type ChatMessage } from "./ollama.js";

export type RouterMessage = ChatMessage;

export type RoutingDecision = {
  target: "local" | "cloud";
  reason: string;
  backend?: "ollama" | "none";
};

export async function decideRoute(
  messages: RouterMessage[],
  isOnline = true,
): Promise<RoutingDecision> {
  const cfg = loadConfig();
  const mode = canUseCloudAI() ? cfg.routing.mode : "local-only";
  const status = await probeOllamaStatus();
  const ollamaReady = status.reachable && status.models.length > 0;

  if (mode === "local-only" || cfg.sovereign.mode === "sovereign") {
    if (ollamaReady) {
      return { target: "local", reason: "Device-only / sovereign — Ollama", backend: "ollama" };
    }
    return {
      target: "local",
      reason: "Local model required — start Ollama and pull a model (st ollama pull)",
      backend: "none",
    };
  }

  if (mode === "cloud-only" && canUseCloudAI()) {
    return { target: "cloud", reason: "Cloud-only routing" };
  }

  if (!isOnline) {
    if (ollamaReady) {
      return { target: "local", reason: "Offline — Ollama", backend: "ollama" };
    }
    return { target: "local", reason: "Offline — no local model", backend: "none" };
  }

  if (ollamaReady) {
    return { target: "local", reason: "Auto — Ollama available", backend: "ollama" };
  }

  if (!canUseCloudAI()) {
    return {
      target: "local",
      reason: "Device-only pledge — cloud blocked",
      backend: "none",
    };
  }

  return { target: "cloud", reason: "Auto — cloud (no local Ollama)" };
}

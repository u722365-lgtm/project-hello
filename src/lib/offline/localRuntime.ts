/**
 * Local (on-device) inference runtime.
 *
 * Thin wrapper over the WebLLM engine that gives the rest of the app a stable
 * API for: routing decisions, readiness checks and one-shot completions.
 */

import {
  WEBLLM_MODELS,
  isModelLoaded,
  getLoadedModelId,
  loadWebLlmModel,
  webLlmChat,
  isWebGPUSupported,
  type WebLlmProgress,
} from "@/lib/webllm/engine";

export type RouterMessage = { role: "system" | "user" | "assistant"; content: string };

export type RoutingMode = "auto" | "local-only" | "cloud-only";
export type RouteTarget = "local" | "cloud";

export const ALL_WEBLLM_MODEL_IDS = WEBLLM_MODELS.map((m) => m.id);

/** Default first-install ("Tier A") model — smallest useful model. */
export const TIER_A_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
export const TIER_A_SIZE_MB = 700;

const ROUTING_KEY = "shadowtalk_routing_mode";
export const ROUTING_CHANGE_EVENT = "shadowtalk-routing-mode-changed";

let heavyDownloadInProgress = false;

export function getRoutingMode(): RoutingMode {
  if (typeof localStorage === "undefined") return "auto";
  const raw = localStorage.getItem(ROUTING_KEY);
  return raw === "local-only" || raw === "cloud-only" ? raw : "auto";
}

export function setRoutingMode(mode: RoutingMode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ROUTING_KEY, mode);
  window.dispatchEvent(new CustomEvent(ROUTING_CHANGE_EVENT, { detail: mode }));
}

export function isAnyLocalModelReady(): boolean {
  return isModelLoaded();
}

export function getActiveLocalModelId(): string | null {
  return getLoadedModelId();
}

export function isHeavyDownloadInProgress(): boolean {
  return heavyDownloadInProgress;
}

export function setHeavyDownloadInProgress(value: boolean): void {
  heavyDownloadInProgress = value;
}

export function decideRoute(opts?: { isOnline?: boolean; forceLocal?: boolean }): {
  target: RouteTarget;
  reason: string;
} {
  const mode = getRoutingMode();
  const online = opts?.isOnline ?? (typeof navigator === "undefined" ? true : navigator.onLine);
  const localReady = isAnyLocalModelReady();

  if (opts?.forceLocal || mode === "local-only") return { target: "local", reason: "local-only" };
  if (mode === "cloud-only") return { target: "cloud", reason: "cloud-only" };
  if (!online && localReady) return { target: "local", reason: "offline" };
  if (!online) return { target: "cloud", reason: "offline-no-local" };
  return { target: "cloud", reason: "auto" };
}

export interface OfflineCompletionRequest {
  messages: RouterMessage[];
  personality?: string;
  isOnline?: boolean;
  maxTokens?: number;
  temperature?: number;
  onDelta?: (token: string, accumulated: string) => void;
}

export interface OfflineCompletionResult {
  content: string;
  model: string;
}

/**
 * Run a completion on-device. Returns null when no local model is available,
 * so callers can fall back to cloud.
 */
export async function runOfflineCompletion(
  req: OfflineCompletionRequest,
): Promise<OfflineCompletionResult | null> {
  if (!isAnyLocalModelReady()) return null;
  try {
    const res = await webLlmChat(req.messages, {
      maxTokens: req.maxTokens,
      temperature: req.temperature,
      onDelta: req.onDelta,
    });
    return { content: res.content, model: res.model ?? (getLoadedModelId() ?? "local") };
  } catch {
    return null;
  }
}

/** Alias used by chat surfaces. */
export const runLocalChat = runOfflineCompletion;

export async function ensureLocalModel(
  modelId: string,
  onProgress?: (p: WebLlmProgress) => void,
): Promise<boolean> {
  if (!isWebGPUSupported()) return false;
  if (isModelLoaded(modelId)) return true;
  try {
    setHeavyDownloadInProgress(true);
    await loadWebLlmModel(modelId, onProgress);
    return true;
  } catch {
    return false;
  } finally {
    setHeavyDownloadInProgress(false);
  }
}

export async function isModelCached(modelId: string): Promise<boolean> {
  try {
    const webllm: any = await import("@mlc-ai/web-llm");
    if (typeof webllm.hasModelInCache === "function") {
      return await webllm.hasModelInCache(modelId);
    }
  } catch {
    /* ignore */
  }
  return isModelLoaded(modelId);
}

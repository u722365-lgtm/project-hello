/**
 * Hybrid Cloud-Local Router (Option B from Shadowoffline blueprint)
 * --------------------------------------------------
 * Decides whether a chat completion runs on-device (Gemma via WebGPU) or in
 * the cloud (Lovable AI Gateway). Uses hardware intelligence for speed:
 *   - Turbo GPU / fast CPU → prefer local when model is ready
 *   - Weak devices + online → cloud for fastest first token
 */

import {
  getSovereignRoutingMode,
  isOllamaInferenceReady,
  isSovereignModeEnabled,
  shouldPreferOllamaInference,
} from "@/lib/desktop/sovereignMode";
import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import { isAnyLocalModelReady } from "./localChat";
import {
  getCachedHardwareProfile,
  shouldPreferLocalInference,
  type HardwareProfile,
} from "@/lib/hardwareIntelligence";

export type RoutingMode = "auto" | "local-only" | "cloud-only";
export type LocalInferenceBackend = "ollama" | "browser" | "none";

export type RoutingDecision = {
  target: "local" | "cloud";
  reason: string;
  backend?: LocalInferenceBackend;
};

export type RouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const PREF_KEY = "shadowtalk_offline_pref";
const PREF_MODEL_KEY = "shadowtalk_offline_model";

export function getRoutingMode(): RoutingMode {
  const v = localStorage.getItem(PREF_KEY);
  return v === "local-only" || v === "cloud-only" ? v : "auto";
}

export function setRoutingMode(mode: RoutingMode) {
  localStorage.setItem(PREF_KEY, mode);
}

export type LocalModelKey = "default" | "e2b" | "e4b";

export function getPreferredLocalModel(): LocalModelKey {
  const v = localStorage.getItem(PREF_MODEL_KEY);
  if (v === "e2b" || v === "e4b" || v === "default") return v;
  return "e2b";
}

export function setPreferredLocalModel(key: LocalModelKey) {
  localStorage.setItem(PREF_MODEL_KEY, key);
}

function isComplex(messages: RouterMessage[]): boolean {
  const last = messages[messages.length - 1]?.content ?? "";
  if (last.length > 4000) return true;
  const totalChars = messages.reduce((s, m) => s + m.content.length, 0);
  if (totalChars > 12000) return true;
  return false;
}

function hardwareWantsLocal(profile: HardwareProfile | null): boolean {
  if (!profile) return false;
  if (profile.path === "cloud") return false;
  if (profile.path === "local-webgpu" || profile.path === "local-wasm") return true;
  // hybrid: local for simple when turbo/performance tier
  return profile.tier === "turbo" || profile.tier === "performance";
}

function pickLocalBackend(): LocalInferenceBackend {
  if (shouldPreferOllamaInference() && isOllamaInferenceReady()) return "ollama";
  if (isAnyLocalModelReady()) return "browser";
  return "none";
}

function localDecision(reason: string, backend: LocalInferenceBackend): RoutingDecision {
  return { target: "local", reason, backend };
}

export function decideRoute(
  messages: RouterMessage[],
  isOnline: boolean,
): RoutingDecision {
  const mode = getRoutingMode();
  const sovereignMode = isSovereignModeEnabled();
  const sovereignRouting = isShadowTalkDesktop() ? getSovereignRoutingMode() : null;
  const ollamaReady = isOllamaInferenceReady();
  const browserLocalReady = isAnyLocalModelReady();
  const anyLocalReady = ollamaReady || browserLocalReady;
  const localBackend = pickLocalBackend();
  const profile = getCachedHardwareProfile();
  const preferLocalHw = shouldPreferLocalInference(profile) && hardwareWantsLocal(profile);

  // Sovereign desktop routing (Odysseus-style — Ollama first)
  if (sovereignRouting === "sovereign") {
    if (ollamaReady && !isComplex(messages)) {
      return localDecision("Sovereign desktop — Ollama local LLM", "ollama");
    }
    if (browserLocalReady) {
      return localDecision("Sovereign desktop — browser model fallback", "browser");
    }
    if (!isOnline) {
      return {
        target: "cloud",
        reason: "Sovereign mode: install Ollama and pull a model for offline chat",
        backend: "none",
      };
    }
  }

  if (mode === "cloud-only" || sovereignRouting === "cloud-only") {
    return { target: "cloud", reason: "User forced cloud-only mode" };
  }

  if (!isOnline) {
    if (ollamaReady) return localDecision("Offline — Ollama on-device AI", "ollama");
    if (browserLocalReady) return localDecision("Offline — browser on-device AI", "browser");
    return {
      target: "cloud",
      reason: "Offline but no local model — install Ollama or download a browser model",
      backend: "none",
    };
  }

  if (mode === "local-only") {
    if (localBackend !== "none") {
      return localDecision(
        localBackend === "ollama" ? "Local-only — Ollama" : "User forced local-only mode",
        localBackend,
      );
    }
    return {
      target: "cloud",
      reason: "Local model not loaded yet — falling back to cloud this time",
      backend: "none",
    };
  }

  // Auto: desktop Ollama when available (simple prompts)
  if (isShadowTalkDesktop() && ollamaReady && !isComplex(messages)) {
    return localDecision("Desktop auto — Ollama local LLM", "ollama");
  }

  // Auto mode (online) — browser local models
  if (browserLocalReady && !isComplex(messages)) {
    if (preferLocalHw) {
      const hw = profile?.summary ?? "fast hardware";
      return localDecision(`Turbo path: ${hw}`, "browser");
    }
    if (profile?.tier === "balanced") {
      return localDecision("Balanced hardware — on-device for simple chat", "browser");
    }
  }

  if (anyLocalReady && preferLocalHw && !isComplex(messages)) {
    return localDecision("Hardware-optimized local inference", localBackend);
  }

  if (profile?.path === "cloud" || profile?.tier === "cloud") {
    if (sovereignMode && ollamaReady) {
      return localDecision("Sovereign — keeping chat on-device despite weak browser GPU", "ollama");
    }
    return {
      target: "cloud",
      reason: "Cloud turbo — fastest on this device for quality responses",
    };
  }

  return {
    target: "cloud",
    reason: anyLocalReady
      ? "Cloud chosen (complex query or hardware profile)"
      : isShadowTalkDesktop()
        ? "Cloud (connect Ollama in Settings for sovereign desktop)"
        : "Cloud (load a local model in Profile for GPU/CPU turbo)",
  };
}

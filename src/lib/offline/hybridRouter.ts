/**
 * Hybrid Cloud-Local Router (Option B from Shadowoffline blueprint)
 * --------------------------------------------------
 * Decides whether a chat completion runs on-device (Gemma via WebGPU) or in
 * the cloud (ShadowTalk AI Gateway). Uses hardware intelligence for speed:
 *   - Turbo GPU / fast CPU → prefer local when model is ready
 *   - Weak devices + online → cloud for fastest first token
 */

import {
  getSovereignRoutingMode,
  isSovereignModeEnabled,
} from "@/lib/desktop/sovereignMode";
import { canUseCloudAI } from "@/lib/privacy/deviceOnlyPledge";
import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import { isForceOfflineSessionActive } from "./forceOfflineSession";
import { isAnyLocalModelReady } from "./localChat";
import {
  getCachedHardwareProfile,
  shouldPreferLocalInference,
  type HardwareProfile,
} from "@/lib/hardwareIntelligence";

export type RoutingMode = "auto" | "local-only" | "cloud-only";
export type LocalInferenceBackend = "browser" | "none";

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
  const mode = canUseCloudAI() ? getRoutingMode() : "local-only";
  const sovereignMode = isSovereignModeEnabled();
  const sovereignRouting = isShadowTalkDesktop() ? getSovereignRoutingMode() : null;
  const browserLocalReady = isAnyLocalModelReady();
  const anyLocalReady = browserLocalReady;
  const localBackend = pickLocalBackend();
  const profile = getCachedHardwareProfile();
  const preferLocalHw = shouldPreferLocalInference(profile) && hardwareWantsLocal(profile);

  // Sovereign desktop routing — browser models first
  if (sovereignRouting === "sovereign") {
    if (browserLocalReady) {
      return localDecision("Sovereign desktop — browser on-device model", "browser");
    }
    if (!isOnline) {
      return {
        target: "cloud",
        reason: "Sovereign mode: download a browser model in Settings → Offline AI for offline chat",
        backend: "none",
      };
    }
  }

  if ((mode === "cloud-only" || sovereignRouting === "cloud-only") && canUseCloudAI()) {
    return { target: "cloud", reason: "User forced cloud-only mode" };
  }

  if (!isOnline) {
    if (browserLocalReady) return localDecision("Offline — browser on-device AI", "browser");
    return {
      target: "local",
      reason: "Offline but no local model — download a browser model in Settings → Offline AI",
      backend: "none",
    };
  }

  if (mode === "local-only" || isForceOfflineSessionActive()) {
    if (localBackend !== "none") {
      return localDecision(
        isForceOfflineSessionActive()
          ? "Offline-only session — on-device AI"
          : "Device-only pledge — on-device AI",
        localBackend,
      );
    }
    if (!isForceOfflineSessionActive() && canUseCloudAI() && isOnline) {
      return {
        target: "cloud",
        reason: "On-device model still downloading — using cloud until ready",
      };
    }
    return {
      target: "local",
      reason: canUseCloudAI()
        ? "Local model not loaded yet — load Offline AI in Settings"
        : "Device-only pledge — load an on-device model (Settings → Offline AI)",
      backend: "none",
    };
  }

  // Auto: browser on-device models when available
  if (browserLocalReady && !isComplex(messages)) {
    if (preferLocalHw) {
      const hw = profile?.summary ?? "fast hardware";
      return localDecision(`Turbo path: ${hw}`, "browser");
    }
    return localDecision("On-device model ready — private local chat", "browser");
  }

  if (anyLocalReady && !isComplex(messages)) {
    return localDecision("Local model ready — on-device chat", localBackend);
  }


  if (profile?.path === "cloud" || profile?.tier === "cloud") {
    return {
      target: "cloud",
      reason: "Cloud turbo — fastest on this device for quality responses",
    };
  }

  if (!canUseCloudAI()) {
    return {
      target: "local",
      reason: "Device-only pledge — cloud AI blocked. Load an on-device model.",
      backend: "none",
    };
  }

  return {
    target: "cloud",
    reason: anyLocalReady
      ? "Cloud chosen (complex query or hardware profile)"
      : "Cloud (load a local model in Profile for GPU/CPU turbo)",
  };
}

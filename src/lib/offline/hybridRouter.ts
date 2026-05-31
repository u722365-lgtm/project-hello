/**
 * Hybrid Cloud-Local Router (Option B from Shadowoffline blueprint)
 * --------------------------------------------------
 * Decides whether a chat completion runs on-device (Gemma via WebGPU) or in
 * the cloud (Lovable AI Gateway). Uses hardware intelligence for speed:
 *   - Turbo GPU / fast CPU → prefer local when model is ready
 *   - Weak devices + online → cloud for fastest first token
 */

import { isAnyLocalModelReady } from "./localChat";
import {
  getCachedHardwareProfile,
  shouldPreferLocalInference,
  type HardwareProfile,
} from "@/lib/hardwareIntelligence";

export type RoutingMode = "auto" | "local-only" | "cloud-only";

export type RoutingDecision = {
  target: "local" | "cloud";
  reason: string;
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

export function decideRoute(
  messages: RouterMessage[],
  isOnline: boolean,
): RoutingDecision {
  const mode = getRoutingMode();
  const localReady = isAnyLocalModelReady();
  const profile = getCachedHardwareProfile();
  const preferLocalHw = shouldPreferLocalInference(profile) && hardwareWantsLocal(profile);

  if (mode === "cloud-only") {
    return { target: "cloud", reason: "User forced cloud-only mode" };
  }

  if (!isOnline) {
    if (localReady) return { target: "local", reason: "Offline — using on-device AI" };
    return {
      target: "cloud",
      reason: "Offline but local model not loaded — will surface offline notice",
    };
  }

  if (mode === "local-only") {
    if (localReady) return { target: "local", reason: "User forced local-only mode" };
    return {
      target: "cloud",
      reason: "Local model not loaded yet — falling back to cloud this time",
    };
  }

  // Auto mode (online)
  if (localReady && !isComplex(messages)) {
    if (preferLocalHw) {
      const hw = profile?.summary ?? "fast hardware";
      return { target: "local", reason: `Turbo path: ${hw}` };
    }
    // Mid-tier: still allow local for privacy on simple prompts
    if (profile?.tier === "balanced") {
      return { target: "local", reason: "Balanced hardware — on-device for simple chat" };
    }
  }

  if (localReady && preferLocalHw && !isComplex(messages)) {
    return { target: "local", reason: "Hardware-optimized local inference" };
  }

  if (profile?.path === "cloud" || profile?.tier === "cloud") {
    return {
      target: "cloud",
      reason: "Cloud turbo — fastest on this device for quality responses",
    };
  }

  return {
    target: "cloud",
    reason: localReady
      ? "Cloud chosen (complex query or hardware profile)"
      : "Cloud (load a local model in Profile for GPU/CPU turbo)",
  };
}

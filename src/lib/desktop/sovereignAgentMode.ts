/**
 * Sovereign agent mode — route missions, tools, and forge pipelines on-device.
 */

import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import {
  getSovereignRoutingMode,
  isOllamaInferenceReady,
  isSovereignModeEnabled,
} from "@/lib/desktop/sovereignMode";
import { isAnyLocalModelReady } from "@/lib/offline/localChat";

const AGENT_KEY = "shadowtalk_sovereign_agents";

export function isSovereignAgentsEnabled(): boolean {
  if (!isShadowTalkDesktop()) return false;
  return localStorage.getItem(AGENT_KEY) !== "0";
}

export function setSovereignAgentsEnabled(enabled: boolean): void {
  localStorage.setItem(AGENT_KEY, enabled ? "1" : "0");
}

export function shouldUseLocalAgent(): boolean {
  if (!isShadowTalkDesktop() || !isSovereignAgentsEnabled()) return false;
  const mode = getSovereignRoutingMode();
  if (mode === "cloud-only") return false;
  const localReady = isOllamaInferenceReady() || isAnyLocalModelReady();
  if (mode === "sovereign") return localReady;
  return isOllamaInferenceReady();
}

export function shouldUseLocalMissionStore(): boolean {
  return shouldUseLocalAgent() && (isSovereignModeEnabled() || !navigator.onLine);
}

/**
 * Sovereign agent mode — route missions, tools, and forge pipelines on-device.
 */

import { isAnonymousAutonomousEnabled } from "@/lib/anonymousAutonomousMode";
import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import {
  getSovereignRoutingMode,
  isOllamaInferenceReady,
  isSovereignModeEnabled,
} from "@/lib/desktop/sovereignMode";
import { isAnyLocalModelReady } from "@/lib/offline/localChat";

const AGENT_KEY = "shadowtalk_sovereign_agents";

export function isSovereignAgentsEnabled(): boolean {
  if (localStorage.getItem(AGENT_KEY) === "0") return false;
  if (isAnonymousAutonomousEnabled()) return true;
  if (!isShadowTalkDesktop()) return false;
  return true;
}

export function setSovereignAgentsEnabled(enabled: boolean): void {
  localStorage.setItem(AGENT_KEY, enabled ? "1" : "0");
}

export function shouldUseLocalAgent(): boolean {
  if (!isSovereignAgentsEnabled()) return false;
  const mode = getSovereignRoutingMode();
  if (mode === "cloud-only") return false;
  const localReady = isOllamaInferenceReady() || isAnyLocalModelReady();
  if (isAnonymousAutonomousEnabled() && localReady) return true;
  if (!isShadowTalkDesktop()) return localReady;
  if (mode === "sovereign") return localReady;
  return isOllamaInferenceReady();
}

export function shouldUseLocalMissionStore(): boolean {
  if (isAnonymousAutonomousEnabled()) return true;
  return shouldUseLocalAgent() && (isSovereignModeEnabled() || !navigator.onLine);
}

/**
 * Forge pipelines (slides, documents, beast mode) only run locally on the
 * desktop build with a live Ollama runtime. In the browser they always use
 * the cloud so users never hit "Cannot reach Ollama at 127.0.0.1:11434".
 */
export function shouldUseLocalForge(): boolean {
  if (!isShadowTalkDesktop()) return false;
  if (getSovereignRoutingMode() === "cloud-only") return false;
  return isOllamaInferenceReady() && shouldUseLocalAgent();
}

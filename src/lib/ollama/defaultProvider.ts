/**
 * Ollama as ShadowTalk's default AI provider — local-first, cloud as fallback.
 */

import { isShadowTalkDesktop } from "@/lib/desktopBridge";

const DEFAULTS_APPLIED_KEY = "shadowtalk_ollama_defaults_applied_v1";
export const OLLAMA_WEB_ENABLED_KEY = "shadowtalk_ollama_web_enabled";
const SOVEREIGN_KEY = "shadowtalk_sovereign_desktop";

/** Apply first-run defaults: Ollama enabled, desktop sovereign routing. */
export function applyOllamaDefaultProvider(): void {
  try {
    if (localStorage.getItem(DEFAULTS_APPLIED_KEY) === "1") return;
    localStorage.setItem(DEFAULTS_APPLIED_KEY, "1");

    if (localStorage.getItem(OLLAMA_WEB_ENABLED_KEY) === null) {
      localStorage.setItem(OLLAMA_WEB_ENABLED_KEY, "1");
    }

    if (isShadowTalkDesktop() && localStorage.getItem(SOVEREIGN_KEY) === null) {
      localStorage.setItem(SOVEREIGN_KEY, "sovereign");
    }
  } catch {
    /* private mode */
  }
}

/** Ollama is the default provider unless the user explicitly disabled it. */
export function isOllamaDefaultProvider(): boolean {
  try {
    return localStorage.getItem(OLLAMA_WEB_ENABLED_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setOllamaDefaultProvider(enabled: boolean): void {
  localStorage.setItem(OLLAMA_WEB_ENABLED_KEY, enabled ? "1" : "0");
}

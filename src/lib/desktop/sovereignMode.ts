/**
 * Sovereign Desktop mode — Odysseus-style local-first routing on Electron.
 * When enabled, chat prefers Ollama over cloud when the sidecar is healthy.
 */

import { isShadowTalkDesktop } from "@/lib/desktopBridge";

const SOVEREIGN_KEY = "shadowtalk_sovereign_desktop";
const OLLAMA_MODEL_KEY = "shadowtalk_ollama_model";
const OLLAMA_URL_KEY = "shadowtalk_ollama_url";

export type SovereignRoutingMode = "auto" | "sovereign" | "cloud-only";

/** Cached Ollama health — updated by useSovereignDesktop hook */
let cachedOllamaReady = false;
let cachedOllamaModels: string[] = [];
let cachedOllamaModel = "";
let cachedOllamaError: string | undefined;

export function isSovereignDesktopAvailable(): boolean {
  return isShadowTalkDesktop();
}

export function getSovereignRoutingMode(): SovereignRoutingMode {
  if (!isShadowTalkDesktop()) return "auto";
  const v = localStorage.getItem(SOVEREIGN_KEY);
  if (v === "sovereign" || v === "cloud-only") return v;
  return "auto";
}

export function setSovereignRoutingMode(mode: SovereignRoutingMode): void {
  localStorage.setItem(SOVEREIGN_KEY, mode);
}

export function isSovereignModeEnabled(): boolean {
  return isShadowTalkDesktop() && getSovereignRoutingMode() === "sovereign";
}

export function getStoredOllamaModel(): string {
  return localStorage.getItem(OLLAMA_MODEL_KEY) ?? "qwen2.5:7b";
}

export function setStoredOllamaModel(model: string): void {
  localStorage.setItem(OLLAMA_MODEL_KEY, model);
}

export function getStoredOllamaUrl(): string {
  return localStorage.getItem(OLLAMA_URL_KEY) ?? "http://127.0.0.1:11434";
}

export function setStoredOllamaUrl(url: string): void {
  localStorage.setItem(OLLAMA_URL_KEY, url.replace(/\/$/, ""));
}

export function updateOllamaCache(status: {
  reachable: boolean;
  models: string[];
  activeModel: string;
  error?: string;
}): void {
  cachedOllamaReady = status.reachable && status.models.length > 0;
  cachedOllamaModels = status.models;
  cachedOllamaModel = status.activeModel;
  cachedOllamaError = status.error;
}

export function isOllamaInferenceReady(): boolean {
  return cachedOllamaReady;
}

export function getCachedOllamaModels(): string[] {
  return cachedOllamaModels;
}

export function getCachedOllamaModel(): string {
  return cachedOllamaModel;
}

export function getCachedOllamaError(): string | undefined {
  return cachedOllamaError;
}

export function shouldPreferOllamaInference(): boolean {
  if (!isShadowTalkDesktop()) return false;
  const mode = getSovereignRoutingMode();
  if (mode === "cloud-only") return false;
  if (mode === "sovereign") return isOllamaInferenceReady();
  // auto: prefer Ollama when ready (desktop with local LLM beats cloud for privacy)
  return isOllamaInferenceReady();
}

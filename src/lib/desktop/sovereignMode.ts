/**
 * Sovereign Desktop mode — local-first routing on Electron.
 * When enabled, chat prefers on-device models over cloud when available.
 */

import { isShadowTalkDesktop } from "@/lib/desktopBridge";

const SOVEREIGN_KEY = "shadowtalk_sovereign_desktop";

export type SovereignRoutingMode = "auto" | "sovereign" | "cloud-only";

export function isSovereignDesktopAvailable(): boolean {
  return isShadowTalkDesktop();
}

export function getSovereignRoutingMode(): SovereignRoutingMode {
  if (!isShadowTalkDesktop()) return "auto";
  const v = localStorage.getItem(SOVEREIGN_KEY);
  if (v === "sovereign" || v === "cloud-only" || v === "auto") return v;
  return "sovereign";
}

export function setSovereignRoutingMode(mode: SovereignRoutingMode): void {
  localStorage.setItem(SOVEREIGN_KEY, mode);
}

export function isSovereignModeEnabled(): boolean {
  return isShadowTalkDesktop() && getSovereignRoutingMode() === "sovereign";
}

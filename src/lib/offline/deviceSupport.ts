/**
 * Detects whether this device can actually run a WebLLM/WebGPU model right now.
 * Used to fail-fast on iOS Safari (no WebGPU) and low-storage phones so we
 * don't waste bandwidth on a download that would never complete.
 */

const MIN_STORAGE_MB = 300; // SmolLM Nano ~130MB + overhead
const SKIP_REASON_KEY = "shadowtalk_offline_skip_reason";

export type OfflineSkipReason =
  | "no-webgpu-mobile"
  | "save-data"
  | "insufficient-storage"
  | "unsupported-browser"
  | null;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as MacIntel but with touch
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)
  );
}

function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function hasWebGPU(): Promise<boolean> {
  try {
    const nav: any = navigator;
    if (!nav?.gpu) return false;
    const adapter = await nav.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

async function estimatedFreeStorageMB(): Promise<number> {
  try {
    if (typeof navigator === "undefined") return Number.POSITIVE_INFINITY;
    const est = await navigator.storage?.estimate?.();
    if (!est?.quota) return Number.POSITIVE_INFINITY;
    const free = est.quota - (est.usage ?? 0);
    return free / (1024 * 1024);
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * Returns why we should skip the silent local-model install on this device,
 * or null when it's safe to proceed.
 */
export async function detectOfflineSkipReason(): Promise<OfflineSkipReason> {
  if (typeof window === "undefined") return "unsupported-browser";

  const conn = (navigator as any).connection;
  if (conn?.saveData) return "save-data";

  const gpu = await hasWebGPU();
  if (!gpu) {
    // iOS Safari has no WebGPU (2026); WebLLM won't load a usable model.
    // Rather than hang the user for hours, skip and keep cloud AI available.
    if (isIOS() || isMobileUA()) return "no-webgpu-mobile";
    return "unsupported-browser";
  }

  const free = await estimatedFreeStorageMB();
  if (free < MIN_STORAGE_MB) return "insufficient-storage";

  return null;
}

export function persistOfflineSkipReason(reason: OfflineSkipReason): void {
  try {
    if (reason) localStorage.setItem(SKIP_REASON_KEY, reason);
    else localStorage.removeItem(SKIP_REASON_KEY);
  } catch {
    /* ignore */
  }
}

export function getOfflineSkipReason(): OfflineSkipReason {
  try {
    const v = localStorage.getItem(SKIP_REASON_KEY);
    if (
      v === "no-webgpu-mobile" ||
      v === "save-data" ||
      v === "insufficient-storage" ||
      v === "unsupported-browser"
    ) {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}

export function humanReadableSkipReason(reason: OfflineSkipReason): string {
  switch (reason) {
    case "no-webgpu-mobile":
      return "Your browser doesn't support on-device AI yet — using ShadowTalk Cloud instead.";
    case "save-data":
      return "Data Saver is on — skipped the on-device model download.";
    case "insufficient-storage":
      return "Not enough free storage for the on-device model — using ShadowTalk Cloud.";
    case "unsupported-browser":
      return "This browser can't run on-device AI — using ShadowTalk Cloud.";
    default:
      return "";
  }
}

/**
 * Device performance tier detection.
 * Runs once at startup, applies a `perf-low` / `perf-mid` / `perf-high` class
 * to <html> so CSS can degrade heavy effects (backdrop-filter, shadows,
 * expensive keyframes) on weak devices, keeping ShadowTalk smooth on
 * everything from a $99 Android to a 32GB workstation.
 */

export type PerfTier = "low" | "mid" | "high";

export interface PerfProfile {
  tier: PerfTier;
  deviceMemory: number;
  cores: number;
  reducedMotion: boolean;
  saveData: boolean;
  slowNetwork: boolean;
}

let cached: PerfProfile | null = null;

function detect(): PerfProfile {
  const nav: any = typeof navigator !== "undefined" ? navigator : {};
  const deviceMemory: number = typeof nav.deviceMemory === "number" ? nav.deviceMemory : 4;
  const cores: number = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 4;
  const isMobile =
    typeof nav.userAgent === "string" && /Mobi|Android|iPhone|iPad|iPod/i.test(nav.userAgent);

  const reducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  const saveData = !!(conn && conn.saveData);
  const effectiveType: string = (conn && conn.effectiveType) || "";
  const slowNetwork = effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";

  let tier: PerfTier;
  if (deviceMemory <= 2 || cores <= 2 || saveData) tier = "low";
  else if (deviceMemory <= 4 || cores <= 4) tier = "mid";
  else tier = "high";

  // Mobile devices punch below their spec (thermal throttling, weaker GPUs).
  // Cap phones/tablets at "mid" so heavy blur/gradients degrade automatically.
  if (isMobile && tier === "high") tier = "mid";

  // Reduced-motion users always at least drop to mid (kills the big shaders).
  if (reducedMotion && tier === "high") tier = "mid";

  return { tier, deviceMemory, cores, reducedMotion, saveData, slowNetwork };
}


export function getPerfProfile(): PerfProfile {
  if (!cached) cached = detect();
  return cached;
}

export function applyPerfProfile(): PerfProfile {
  if (typeof document === "undefined") return getPerfProfile();
  const profile = getPerfProfile();
  const root = document.documentElement;
  root.classList.remove("perf-low", "perf-mid", "perf-high");
  root.classList.add(`perf-${profile.tier}`);
  if (profile.saveData) root.classList.add("perf-save-data");
  if (profile.slowNetwork) root.classList.add("perf-slow-net");
  root.dataset.perfTier = profile.tier;
  return profile;
}

export function isLowEndDevice(): boolean {
  return getPerfProfile().tier === "low";
}

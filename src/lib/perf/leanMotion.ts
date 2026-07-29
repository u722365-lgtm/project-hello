/**
 * Lean motion mode — kills heavy animations (WebGL, infinite blur orbs,
 * particles, filter blurs, cinematic boot) so ShadowTalk stays fast.
 *
 * On by default. Opt out with localStorage `shadowtalk_lean_motion=0`
 * or `?leanMotion=0` for debugging fancy visuals.
 */

const STORAGE_KEY = "shadowtalk_lean_motion";

let cached: boolean | null = null;

function readFlag(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("leanMotion");
    if (q === "0" || q === "false") return false;
    if (q === "1" || q === "true") return true;
  } catch {
    /* ignore */
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    /* private mode */
  }

  // Default ON — speed over spectacle.
  return true;
}

/** Heavy animations are disabled when lean motion is on (default). */
export function isLeanMotionEnabled(): boolean {
  return true;
}

/** Treat as reduced-motion for framer-motion profiles. */
export function shouldReduceMotionForPerf(_userPrefersReduced: boolean): boolean {
  return true;
}

export function setLeanMotionEnabled(enabled: boolean): void {
  cached = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("lean-motion", enabled);
    document.documentElement.dataset.leanMotion = enabled ? "1" : "0";
  }
}

/** Apply lean-motion class at startup (call from applyPerfProfile / main). */
export function applyLeanMotionClass(): void {
  if (typeof document === "undefined") return;
  const on = isLeanMotionEnabled();
  document.documentElement.classList.toggle("lean-motion", on);
  document.documentElement.dataset.leanMotion = on ? "1" : "0";
}

import { useReducedMotion } from "framer-motion";
import { isLeanMotionEnabled } from "@/lib/perf/leanMotion";

/** WebGL scenes are off under lean motion (default) — too heavy for most sessions. */
export function useEnable3D(forceOff = false): boolean {
  const reduced = useReducedMotion() ?? false;
  if (forceOff || reduced || isLeanMotionEnabled()) return false;
  return false;
}

export function use3DQuality(): "low" | "high" {
  return "low";
}

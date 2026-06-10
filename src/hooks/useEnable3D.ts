import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

/** Enable WebGL scenes unless user prefers reduced motion or we're on very small screens. */
export function useEnable3D(forceOff = false): boolean {
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  if (forceOff || reduced) return false;
  return true;
}

export function use3DQuality(): "low" | "high" {
  const isMobile = useIsMobile();
  return isMobile ? "low" : "high";
}

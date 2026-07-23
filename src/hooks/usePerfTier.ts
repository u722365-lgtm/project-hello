import { useEffect, useState } from "react";
import { getPerfProfile, type PerfProfile, type PerfTier } from "@/lib/perf/devicePerfTier";

/**
 * React hook exposing the device's performance tier so components can
 * skip heavy work (particles, framer-motion, 3D scenes) on low-end devices.
 */
export function usePerfTier(): PerfProfile {
  const [profile, setProfile] = useState<PerfProfile>(() => getPerfProfile());
  useEffect(() => {
    setProfile(getPerfProfile());
  }, []);
  return profile;
}

export function useIsLowEnd(): boolean {
  return usePerfTier().tier === "low";
}

export type { PerfTier, PerfProfile };

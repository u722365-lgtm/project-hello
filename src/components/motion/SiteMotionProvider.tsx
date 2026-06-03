import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { getSiteMotionIntensity, type SiteMotionIntensity } from "@/lib/siteMotion";

type SiteMotionContextValue = ReturnType<typeof useLandingMotion> & {
  intensity: SiteMotionIntensity;
  isLandingPage: boolean;
};

const SiteMotionContext = createContext<SiteMotionContextValue | null>(null);

export function SiteMotionProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const motion = useLandingMotion();
  const intensity = getSiteMotionIntensity(pathname);
  const isLandingPage = pathname === "/home" || pathname === "/";

  const value = useMemo(
    () => ({ ...motion, intensity, isLandingPage }),
    [motion, intensity, isLandingPage],
  );

  return <SiteMotionContext.Provider value={value}>{children}</SiteMotionContext.Provider>;
}

export function useSiteMotion() {
  const ctx = useContext(SiteMotionContext);
  const fallback = useLandingMotion();
  if (ctx) return ctx;
  return {
    ...fallback,
    intensity: "standard" as SiteMotionIntensity,
    isLandingPage: false,
  };
}

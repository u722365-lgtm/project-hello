import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

type SiteMotionContextValue = {
  intensity: "minimal";
  isLandingPage: boolean;
  reduced: boolean;
  profile: { reduced: boolean; mobile: boolean };
  viewport: { once: boolean; amount: number };
  hoverLift: boolean;
  variants: Record<string, unknown>;
  isMobile: boolean;
};

const SiteMotionContext = createContext<SiteMotionContextValue | null>(null);

export function SiteMotionProvider({ children }: { children: ReactNode }) {
  const memoized = useMemo(
    () => ({
      intensity: "minimal" as const,
      isLandingPage: false,
      reduced: true,
      profile: { reduced: true, mobile: false },
      viewport: { once: true, amount: 0 },
      hoverLift: false,
      variants: { hidden: {}, visible: {}, staggerItem: {}, staggerList: {} },
      isMobile: false,
    }),
    [],
  );

  return <SiteMotionContext.Provider value={memoized}>{children}</SiteMotionContext.Provider>;
}

export function useSiteMotion() {
  const ctx = useContext(SiteMotionContext);
  if (ctx) return ctx;
  return {
    intensity: "minimal" as const,
    isLandingPage: false,
    reduced: true,
    profile: { reduced: true, mobile: false },
    viewport: { once: true, amount: 0 },
    hoverLift: false,
    variants: { hidden: {}, visible: {}, staggerItem: {}, staggerList: {} },
    isMobile: false,
  };
}

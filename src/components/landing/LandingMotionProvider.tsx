import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Transition, Variants } from "framer-motion";
import {
  cardReveal,
  fadeSlideUp,
  floatingOrbTransition,
  hoverLift as hoverLiftFor,
  landingViewport,
  scaleFadeIn,
  sectionReveal,
  slideDown,
  slideInLeft,
  slideInRight,
  staggerContainer,
  popIn,
  type LandingMotionProfile,
} from "@/lib/landingMotion";

type LandingMotionContextValue = {
  profile: LandingMotionProfile;
  reduced: boolean;
  isMobile: boolean;
  isLandingPage: boolean;
  viewport: { once: boolean; margin?: string; amount?: number };
  hoverLift: Record<string, unknown>;
  orbTransition: Transition;
  variants: Record<string, Variants>;
};

function buildValue(profile: LandingMotionProfile, isLandingPage: boolean): LandingMotionContextValue {
  return {
    profile,
    reduced: profile.reduced,
    isMobile: profile.mobile,
    isLandingPage,
    viewport: landingViewport(profile),
    hoverLift: hoverLiftFor(profile) as Record<string, unknown>,
    orbTransition: floatingOrbTransition(profile),
    variants: {
      hidden: fadeSlideUp(profile),
      visible: fadeSlideUp(profile),
      fadeUp: fadeSlideUp(profile),
      scale: scaleFadeIn(profile),
      section: sectionReveal(profile),
      cardReveal: cardReveal(profile),
      slideDown: slideDown(profile),
      slideLeft: slideInLeft(profile),
      slideRight: slideInRight(profile),
      pop: popIn(profile),
      staggerItem: fadeSlideUp(profile),
      staggerList: staggerContainer(profile),
    },
  };
}

function detectProfile(): LandingMotionProfile {
  if (typeof window === "undefined") return { reduced: true, mobile: false };
  return {
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    mobile: window.matchMedia("(max-width: 768px)").matches,
  };
}

const LandingMotionContext = createContext<LandingMotionContextValue | null>(null);

export function LandingMotionProvider({
  children,
  isLandingPage = true,
}: {
  children: ReactNode;
  isLandingPage?: boolean;
}) {
  const value = useMemo(() => buildValue(detectProfile(), isLandingPage), [isLandingPage]);
  return <LandingMotionContext.Provider value={value}>{children}</LandingMotionContext.Provider>;
}

export function useLandingMotionContext(): LandingMotionContextValue {
  const ctx = useContext(LandingMotionContext);
  return ctx ?? buildValue(detectProfile(), false);
}

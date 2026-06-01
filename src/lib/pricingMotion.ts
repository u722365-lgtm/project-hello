import type { Variants } from "framer-motion";
import {
  cardReveal,
  fadeSlideUp,
  LANDING_EASE,
  motionDuration,
  popIn,
  scaleFadeIn,
  staggerContainer,
  staggerDelay,
  type LandingMotionProfile,
} from "@/lib/landingMotion";

export function pricingProfile(reduced: boolean, mobile: boolean): LandingMotionProfile {
  return { reduced, mobile };
}

export function pricingVariants(profile: LandingMotionProfile) {
  return {
    fadeUp: fadeSlideUp(profile),
    scaleIn: scaleFadeIn(profile),
    pop: popIn(profile),
    stagger: staggerContainer(profile),
    card: cardReveal(profile),
  };
}

export const pricingSpring = {
  card: { type: "spring" as const, stiffness: 340, damping: 28 },
  layout: { type: "spring" as const, stiffness: 400, damping: 32 },
  toggle: { type: "spring" as const, stiffness: 500, damping: 35 },
};

export function heroTitleVariants(profile: LandingMotionProfile): Variants {
  return {
    hidden: { opacity: 0, y: profile.reduced ? 0 : 32, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: motionDuration(profile, 0.75), ease: LANDING_EASE },
    },
  };
}

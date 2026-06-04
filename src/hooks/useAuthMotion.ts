import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AuthMotionProfile } from "@/lib/authMotion";
import {
  AUTH_SPRING,
  AUTH_SPRING_SNAPPY,
  authDuration,
  authFormSwap,
  authGlassCard,
  authGridDrift,
  authOAuthItem,
  authPageEnter,
  authStagger,
  authStaggerItem,
  authStaggerList,
  authTitleSwap,
} from "@/lib/authMotion";

export function useAuthMotion() {
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const profile: AuthMotionProfile = { reduced, mobile: isMobile };

  return {
    profile,
    reduced,
    isMobile,
    spring: AUTH_SPRING,
    springSnappy: AUTH_SPRING_SNAPPY,
    duration: (desktop = 0.55) => authDuration(profile, desktop),
    stagger: (desktop = 0.07) => authStagger(profile, desktop),
    variants: {
      pageEnter: authPageEnter(profile),
      glassCard: authGlassCard(profile),
      staggerList: authStaggerList(profile),
      staggerItem: authStaggerItem(profile),
      formSwap: authFormSwap(profile),
      titleSwap: authTitleSwap(profile),
      oauthItem: (index: number) => authOAuthItem(profile, index),
    },
    gridDrift: authGridDrift(profile),
    shouldAnimateAmbient: !reduced,
  };
}

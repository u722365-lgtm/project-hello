import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AuthMotionProfile } from "@/lib/authMotion";
import {
  AUTH_SPRING,
  AUTH_SPRING_SNAPPY,
  authDuration,
  authFormSwap,
  authGlassCard,
  authGlassFloat,
  authGridDrift,
  authHeaderItem,
  authHeaderStagger,
  authOAuthItem,
  authPageEnter,
  authSecurityBadge,
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
      headerStagger: authHeaderStagger(profile),
      headerItem: authHeaderItem(profile),
      oauthItem: (index: number) => authOAuthItem(profile, index),
      securityBadge: (index: number) => authSecurityBadge(profile, index),
    },
    glassFloat: authGlassFloat(profile),
    gridDrift: authGridDrift(profile),
    shouldAnimateAmbient: !reduced,
  };
}

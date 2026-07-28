import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { shouldReduceMotionForPerf } from "@/lib/perf/leanMotion";
import type { AdminMotionProfile } from "@/lib/adminMotion";
import {
  ADMIN_SPRING,
  ADMIN_SPRING_SNAPPY,
  adminCardHover,
  adminDuration,
  adminHeaderReveal,
  adminLoadingPulse,
  adminNavGroup,
  adminNavItem,
  adminPageEnter,
  adminSectionSwap,
  adminShimmerSweep,
  adminStagger,
  adminStaggerItem,
  adminStaggerList,
} from "@/lib/adminMotion";

export function useAdminMotion() {
  const reduced = shouldReduceMotionForPerf(useReducedMotion() ?? false);
  const isMobile = useIsMobile();
  const profile: AdminMotionProfile = { reduced, mobile: isMobile };

  return {
    profile,
    reduced,
    isMobile,
    spring: ADMIN_SPRING,
    springSnappy: ADMIN_SPRING_SNAPPY,
    duration: (desktop = 0.5) => adminDuration(profile, desktop),
    stagger: (desktop = 0.07) => adminStagger(profile, desktop),
    variants: {
      pageEnter: adminPageEnter(profile),
      sectionSwap: adminSectionSwap(profile),
      staggerList: adminStaggerList(profile),
      staggerItem: adminStaggerItem(profile),
      navGroup: adminNavGroup(profile),
      navItem: adminNavItem(profile),
      headerReveal: adminHeaderReveal(profile),
      loadingPulse: adminLoadingPulse(profile),
    },
    cardHover: adminCardHover(profile),
    shimmerSweep: adminShimmerSweep(profile),
    shouldAnimateAmbient: !reduced,
  };
}

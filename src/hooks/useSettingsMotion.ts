import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { shouldReduceMotionForPerf } from "@/lib/perf/leanMotion";
import type { SettingsMotionProfile } from "@/lib/settingsMotion";
import {
  SETTINGS_SPRING,
  SETTINGS_SPRING_SNAPPY,
  headerRevealVariants,
  heroCollapseVariants,
  loadingPulseVariants,
  navItemSpring,
  searchResultVariants,
  sectionPanelVariants,
  settingsDuration,
  settingsStagger,
  staggerItemVariants,
  staggerListVariants,
} from "@/lib/settingsMotion";

export function useSettingsMotion() {
  const reduced = shouldReduceMotionForPerf(useReducedMotion() ?? false);
  const isMobile = useIsMobile();
  const profile: SettingsMotionProfile = { reduced, mobile: isMobile };

  return {
    profile,
    reduced,
    isMobile,
    spring: SETTINGS_SPRING,
    springSnappy: SETTINGS_SPRING_SNAPPY,
    duration: (desktop = 0.45) => settingsDuration(profile, desktop),
    stagger: (desktop = 0.06) => settingsStagger(profile, desktop),
    sectionPanel: sectionPanelVariants(profile),
    staggerList: staggerListVariants(profile),
    staggerItem: staggerItemVariants(profile),
    headerReveal: headerRevealVariants(profile),
    loadingPulse: loadingPulseVariants(profile),
    heroCollapse: heroCollapseVariants(profile),
    searchResult: searchResultVariants(profile),
    navSpring: navItemSpring(),
    shouldAnimateAmbient: !reduced,
  };
}

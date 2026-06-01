import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SettingsMotionProfile } from "@/lib/settingsMotion";
import {
  headerRevealVariants,
  loadingPulseVariants,
  navItemSpring,
  sectionPanelVariants,
  settingsDuration,
  settingsStagger,
  staggerItemVariants,
  staggerListVariants,
} from "@/lib/settingsMotion";

export function useSettingsMotion() {
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const profile: SettingsMotionProfile = { reduced, mobile: isMobile };

  return {
    profile,
    reduced,
    isMobile,
    duration: (desktop = 0.45) => settingsDuration(profile, desktop),
    stagger: (desktop = 0.08) => settingsStagger(profile, desktop),
    sectionPanel: sectionPanelVariants(profile),
    staggerList: staggerListVariants(profile),
    staggerItem: staggerItemVariants(profile),
    headerReveal: headerRevealVariants(profile),
    loadingPulse: loadingPulseVariants(profile),
    navSpring: navItemSpring(),
    shouldAnimateAmbient: !reduced,
  };
}

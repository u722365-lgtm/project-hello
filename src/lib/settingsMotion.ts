import type { Transition, Variants } from "framer-motion";

export const SETTINGS_EASE = [0.22, 1, 0.36, 1] as const;

export type SettingsMotionProfile = {
  reduced: boolean;
  mobile: boolean;
};

export function settingsDuration(profile: SettingsMotionProfile, desktop = 0.45): number {
  if (profile.reduced) return 0.01;
  return profile.mobile ? Math.min(desktop, 0.35) : desktop;
}

export function settingsStagger(profile: SettingsMotionProfile, desktop = 0.08): number {
  if (profile.reduced) return 0;
  return profile.mobile ? desktop * 0.7 : desktop;
}

export function sectionPanelVariants(profile: SettingsMotionProfile): Variants {
  const x = profile.reduced ? 0 : profile.mobile ? 0 : 16;
  const y = profile.reduced ? 0 : profile.mobile ? 10 : 0;
  return {
    initial: { opacity: 0, x, y, filter: profile.reduced ? "blur(0px)" : "blur(6px)" },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: settingsDuration(profile, 0.4),
        ease: SETTINGS_EASE,
      },
    },
    exit: {
      opacity: 0,
      x: profile.reduced ? 0 : -8,
      y: profile.reduced ? 0 : 6,
      filter: profile.reduced ? "blur(0px)" : "blur(4px)",
      transition: { duration: settingsDuration(profile, 0.22) },
    },
  };
}

export function staggerListVariants(profile: SettingsMotionProfile): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: settingsStagger(profile, 0.07),
        delayChildren: profile.reduced ? 0 : 0.04,
      },
    },
  };
}

export function staggerItemVariants(profile: SettingsMotionProfile): Variants {
  const y = profile.reduced ? 0 : 14;
  return {
    hidden: { opacity: 0, y, scale: profile.reduced ? 1 : 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: settingsDuration(profile, 0.38),
        ease: SETTINGS_EASE,
      },
    },
  };
}

export function navItemSpring(): Transition {
  return { type: "spring", stiffness: 420, damping: 32 };
}

export function headerRevealVariants(profile: SettingsMotionProfile): Variants {
  return {
    hidden: { opacity: 0, y: profile.reduced ? 0 : -12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: settingsDuration(profile, 0.5), ease: SETTINGS_EASE },
    },
  };
}

export function loadingPulseVariants(profile: SettingsMotionProfile): Variants {
  return {
    animate: profile.reduced
      ? { opacity: 1 }
      : {
          opacity: [0.4, 1, 0.4],
          scale: [0.96, 1, 0.96],
          transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
        },
  };
}

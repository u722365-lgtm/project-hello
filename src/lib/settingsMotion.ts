import type { Transition, Variants } from "framer-motion";

/** Premium ease — soft deceleration */
export const SETTINGS_EASE = [0.16, 1, 0.3, 1] as const;

export const SETTINGS_SPRING: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export const SETTINGS_SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.65,
};

export type SettingsMotionProfile = {
  reduced: boolean;
  mobile: boolean;
};

export function settingsDuration(profile: SettingsMotionProfile, desktop = 0.45): number {
  if (profile.reduced) return 0.01;
  return profile.mobile ? Math.min(desktop, 0.32) : desktop;
}

export function settingsStagger(profile: SettingsMotionProfile, desktop = 0.06): number {
  if (profile.reduced) return 0;
  return profile.mobile ? desktop * 0.65 : desktop;
}

export function sectionPanelVariants(profile: SettingsMotionProfile): Variants {
  if (profile.reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    };
  }

  return {
    initial: (dir: number) => {
      const direction = dir >= 0 ? 1 : -1;
      return {
        opacity: 0,
        x: profile.mobile ? 0 : direction * 28,
        y: profile.mobile ? direction * 18 : 8,
        scale: 0.98,
        filter: "blur(8px)",
      };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: SETTINGS_SPRING,
    },
    exit: (dir: number) => {
      const direction = dir >= 0 ? 1 : -1;
      return {
        opacity: 0,
        x: -direction * (profile.mobile ? 12 : 20),
        y: -4,
        scale: 0.99,
        filter: "blur(4px)",
        transition: { duration: 0.2, ease: SETTINGS_EASE },
      };
    },
  };
}

export function staggerListVariants(profile: SettingsMotionProfile): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: settingsStagger(profile, 0.055),
        delayChildren: profile.reduced ? 0 : 0.06,
      },
    },
  };
}

export function staggerItemVariants(profile: SettingsMotionProfile): Variants {
  const y = profile.reduced ? 0 : 20;
  return {
    hidden: { opacity: 0, y, scale: profile.reduced ? 1 : 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: SETTINGS_SPRING,
    },
  };
}

export function navItemSpring(): Transition {
  return SETTINGS_SPRING_SNAPPY;
}

export function headerRevealVariants(profile: SettingsMotionProfile): Variants {
  return {
    hidden: { opacity: 0, y: profile.reduced ? 0 : -16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: profile.reduced
        ? { duration: 0.01 }
        : { ...SETTINGS_SPRING, delay: 0.02 },
    },
  };
}

export function loadingPulseVariants(profile: SettingsMotionProfile): Variants {
  return {
    animate: profile.reduced
      ? { opacity: 1 }
      : {
          opacity: [0.5, 1, 0.5],
          scale: [0.94, 1, 0.94],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        },
  };
}

export function heroCollapseVariants(profile: SettingsMotionProfile): Variants {
  return {
    expanded: {
      height: "auto",
      opacity: 1,
      marginBottom: profile.mobile ? 16 : 24,
      transition: SETTINGS_SPRING,
    },
    collapsed: {
      height: 0,
      opacity: 0,
      marginBottom: 0,
      transition: { duration: settingsDuration(profile, 0.28), ease: SETTINGS_EASE },
    },
  };
}

export function searchResultVariants(profile: SettingsMotionProfile): Variants {
  return {
    hidden: { opacity: 0, x: profile.reduced ? 0 : -8 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: profile.reduced ? 0 : i * 0.04,
        ...SETTINGS_SPRING,
      },
    }),
  };
}

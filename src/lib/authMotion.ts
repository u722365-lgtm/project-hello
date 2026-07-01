import type { Transition, Variants } from "framer-motion";

export const AUTH_EASE = [0.16, 1, 0.3, 1] as const;

export const AUTH_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.75,
};

export const AUTH_SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 560,
  damping: 36,
  mass: 0.6,
};

export type AuthMotionProfile = {
  reduced: boolean;
  mobile: boolean;
};

export function authDuration(profile: AuthMotionProfile, desktop = 0.55): number {
  if (profile.reduced) return 0.01;
  return profile.mobile ? Math.min(desktop, 0.35) : desktop;
}

export function authStagger(profile: AuthMotionProfile, desktop = 0.07): number {
  if (profile.reduced) return 0;
  return profile.mobile ? desktop * 0.7 : desktop;
}

export function authPageEnter(profile: AuthMotionProfile): Variants {
  if (profile.reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    };
  }
  return {
    hidden: { opacity: 0, y: profile.mobile ? 20 : 36, filter: "blur(14px)", scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: authDuration(profile, 0.75), ease: AUTH_EASE },
    },
  };
}

export function authGlassCard(profile: AuthMotionProfile): Variants {
  if (profile.reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { ...AUTH_SPRING, delay: 0.08 },
    },
  };
}

export function authStaggerList(profile: AuthMotionProfile): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: authStagger(profile, 0.08),
        delayChildren: profile.reduced ? 0 : 0.12,
      },
    },
  };
}

export function authStaggerItem(profile: AuthMotionProfile): Variants {
  if (profile.reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 22, x: -10, scale: 0.97, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { ...AUTH_SPRING, duration: authDuration(profile, 0.45) },
    },
  };
}

export function authFormSwap(profile: AuthMotionProfile): Variants {
  if (profile.reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    };
  }
  return {
    initial: { opacity: 0, x: -28, y: 8, filter: "blur(10px)", scale: 0.98 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: authDuration(profile, 0.42), ease: AUTH_EASE },
    },
    exit: {
      opacity: 0,
      x: 28,
      y: -6,
      filter: "blur(8px)",
      scale: 0.98,
      transition: { duration: 0.28, ease: AUTH_EASE },
    },
  };
}

export function authTitleSwap(profile: AuthMotionProfile): Variants {
  if (profile.reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 12, filter: "blur(4px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: AUTH_SPRING_SNAPPY,
    },
    exit: {
      opacity: 0,
      y: -10,
      filter: "blur(4px)",
      transition: { duration: 0.18, ease: AUTH_EASE },
    },
  };
}

export function authOAuthItem(profile: AuthMotionProfile, index: number): Variants {
  if (profile.reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };
  }
  return {
    hidden: { opacity: 0, y: 10, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.35 + index * authStagger(profile, 0.06),
        duration: authDuration(profile, 0.35),
        ease: AUTH_EASE,
      },
    },
  };
}

export function authGridDrift(profile: AuthMotionProfile): Transition | false {
  if (profile.reduced) return false;
  return { duration: profile.mobile ? 40 : 28, repeat: Infinity, ease: "linear" as const };
}

export function authHeaderStagger(profile: AuthMotionProfile): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: authStagger(profile, 0.1),
        delayChildren: profile.reduced ? 0 : 0.2,
      },
    },
  };
}

export function authHeaderItem(profile: AuthMotionProfile): Variants {
  if (profile.reduced) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  }
  return {
    hidden: { opacity: 0, y: 16, scale: 0.92 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: AUTH_SPRING_SNAPPY,
    },
  };
}

export function authSecurityBadge(profile: AuthMotionProfile, index: number): Variants {
  if (profile.reduced) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  }
  return {
    hidden: { opacity: 0, y: 8, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.5 + index * 0.08,
        ...AUTH_SPRING,
      },
    },
  };
}

export function authGlassFloat(profile: AuthMotionProfile) {
  if (profile.reduced) return undefined;
  return {
    y: profile.mobile ? [-4, 4, -4] : [-8, 8, -8],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
  };
}

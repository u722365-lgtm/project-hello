import type { Transition, Variants } from "framer-motion";

export const ADMIN_EASE = [0.16, 1, 0.3, 1] as const;

export const ADMIN_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.75,
};

export const ADMIN_SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 560,
  damping: 36,
  mass: 0.6,
};

export type AdminMotionProfile = {
  reduced: boolean;
  mobile: boolean;
};

export function adminDuration(profile: AdminMotionProfile, desktop = 0.5): number {
  if (profile.reduced) return 0.01;
  return profile.mobile ? Math.min(desktop, 0.34) : desktop;
}

export function adminStagger(profile: AdminMotionProfile, desktop = 0.07): number {
  if (profile.reduced) return 0;
  return profile.mobile ? desktop * 0.7 : desktop;
}

export function adminPageEnter(profile: AdminMotionProfile): Variants {
  if (profile.reduced) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } };
  }
  return {
    hidden: { opacity: 0, y: 24, filter: "blur(12px)", scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: adminDuration(profile, 0.65), ease: ADMIN_EASE },
    },
  };
}

export function adminSectionSwap(profile: AdminMotionProfile): Variants {
  if (profile.reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    };
  }
  return {
    initial: { opacity: 0, x: -32, y: 10, filter: "blur(10px)", scale: 0.98 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: adminDuration(profile, 0.42), ease: ADMIN_EASE },
    },
    exit: {
      opacity: 0,
      x: 32,
      y: -8,
      filter: "blur(8px)",
      scale: 0.98,
      transition: { duration: 0.26, ease: ADMIN_EASE },
    },
  };
}

export function adminStaggerList(profile: AdminMotionProfile): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: adminStagger(profile, 0.08),
        delayChildren: profile.reduced ? 0 : 0.1,
      },
    },
  };
}

export function adminStaggerItem(profile: AdminMotionProfile): Variants {
  if (profile.reduced) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } };
  }
  return {
    hidden: { opacity: 0, y: 20, x: -8, scale: 0.97, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: ADMIN_SPRING,
    },
  };
}

export function adminNavGroup(profile: AdminMotionProfile): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: adminStagger(profile, 0.04), delayChildren: 0.15 },
    },
  };
}

export function adminNavItem(profile: AdminMotionProfile): Variants {
  if (profile.reduced) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  }
  return {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: ADMIN_SPRING_SNAPPY },
  };
}

export function adminHeaderReveal(profile: AdminMotionProfile): Variants {
  if (profile.reduced) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  }
  return {
    hidden: { opacity: 0, y: -14, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { ...ADMIN_SPRING, delay: 0.05 },
    },
  };
}

export function adminCardHover(profile: AdminMotionProfile) {
  if (profile.reduced) return undefined;
  return {
    y: -4,
    scale: 1.01,
    boxShadow: "0 16px 40px -12px rgba(99, 102, 241, 0.2)",
    transition: ADMIN_SPRING_SNAPPY,
  };
}

export function adminLoadingPulse(profile: AdminMotionProfile): Variants {
  return {
    animate: profile.reduced
      ? { opacity: 1 }
      : {
          opacity: [0.45, 1, 0.45],
          scale: [0.92, 1.04, 0.92],
          rotate: [0, 4, -4, 0],
          transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
        },
  };
}

export function adminShimmerSweep(profile: AdminMotionProfile) {
  if (profile.reduced) return undefined;
  return {
    x: ["-100%", "200%"],
    transition: { duration: 2.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" },
  };
}

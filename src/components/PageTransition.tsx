import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { shouldReduceMotionForPerf } from "@/lib/perf/leanMotion";

/** Instant / no-op transitions — lean motion default for speed. */
const pageVariantsLean = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
};

export const PageTransition = ({ children }: { children: ReactNode }) => {
  const reduced = shouldReduceMotionForPerf(useReducedMotion() ?? false);
  // Always use lean/instant variants when lean motion is on (default).
  const variants = reduced ? pageVariantsLean : pageVariantsLean;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full min-h-0"
    >
      {children}
    </motion.div>
  );
};

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const pageVariantsDesktop = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
};

const pageVariantsMobile = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const pageVariantsReduced = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
};

export const PageTransition = ({ children }: { children: ReactNode }) => {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const variants = reduced ? pageVariantsReduced : isMobile ? pageVariantsMobile : pageVariantsDesktop;

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

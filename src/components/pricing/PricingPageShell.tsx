import { motion, useScroll, useSpring } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

type PricingPageShellProps = {
  children: React.ReactNode;
};

const PricingPageShell = ({ children }: PricingPageShellProps) => {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <div className="pricing-page relative min-h-screen overflow-x-hidden">
      <div className="pricing-page-bg" aria-hidden />
      {!reduced && (
        <>
          <motion.div
            className="pricing-orb pricing-orb-a"
            animate={{ y: [0, -24, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: isMobile ? 14 : 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pricing-orb pricing-orb-b"
            animate={{ y: [0, 20, 0], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: isMobile ? 16 : 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      {!reduced && (
        <motion.div className="pricing-scroll-progress" style={{ scaleX }} aria-hidden />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

export default PricingPageShell;

import { motion, useScroll, useSpring } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useSiteMotion } from "@/components/motion/SiteMotionProvider";

type SitePageShellProps = {
  children: React.ReactNode;
};

/**
 * Global page chrome: scroll progress + ambient background on all routes.
 * Skips duplicate chrome on /home (Index uses LandingPageShell).
 */
const SitePageShell = ({ children }: SitePageShellProps) => {
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();
  const { reduced, isMobile, intensity, isLandingPage } = useSiteMotion();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  const isChatWorkspace = pathname === "/chatbot";

  if (isChatWorkspace) {
    return (
      <div className="site-page relative h-[100dvh] max-h-[100dvh] overflow-hidden">
        {children}
      </div>
    );
  }

  if (isLandingPage) {
    return <div className="site-page relative app-min-height">{children}</div>;
  }

  const showAmbient = !reduced && intensity !== "minimal";
  const showProgress = !reduced && intensity !== "minimal";

  return (
    <div className="site-page relative app-min-height overflow-x-hidden">
      {showProgress && (
        <motion.div
          className="site-scroll-progress landing-scroll-progress fixed top-0 left-0 right-0 h-[2px] origin-left z-[100] pointer-events-none"
          style={{ scaleX }}
          aria-hidden
        />
      )}
      {showAmbient ? (
        <motion.div
          className="site-page-ambient landing-page-ambient pointer-events-none fixed inset-0 z-0"
          aria-hidden
          animate={{ opacity: isMobile ? [0.22, 0.38, 0.22] : [0.3, 0.48, 0.3] }}
          transition={{ duration: isMobile ? 20 : 16, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <div className="site-page-ambient-static landing-page-ambient-static pointer-events-none fixed inset-0 z-0 opacity-30" aria-hidden />
      )}
      <div className="site-page-grain landing-page-grain pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

export default SitePageShell;

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";
import { LANDING_SPRING, tiltStrength } from "@/lib/landingMotion";

type LandingInteractiveCardProps = {
  children: ReactNode;
  className?: string;
  index?: number;
  variants?: Variants;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  onKeyDown?: (e: KeyboardEvent) => void;
  inView?: boolean;
};

/**
 * Scroll-reveal card with optional 3D tilt on pointer move (desktop, motion-safe).
 */
const LandingInteractiveCard = ({
  children,
  className = "",
  index,
  variants,
  onClick,
  role,
  tabIndex,
  onKeyDown,
  inView = true,
}: LandingInteractiveCardProps) => {
  const { profile, viewport, hoverLift, variants: ctxVariants } = useLandingMotionContext();
  const ref = useRef<HTMLDivElement>(null);
  const maxTilt = tiltStrength(profile);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), LANDING_SPRING.tilt);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), LANDING_SPRING.tilt);
  const motionVariants = variants ?? ctxVariants.cardReveal;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty("--shine-x", `${px}%`);
    ref.current.style.setProperty("--shine-y", `${py}%`);
    if (!maxTilt) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const resetTilt = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={motionVariants}
      initial="hidden"
      {...(inView
        ? { whileInView: "visible" as const, viewport }
        : { animate: "visible" as const })}
      whileHover={hoverLift}
      whileTap={profile.reduced ? undefined : { scale: 0.99 }}
      style={
        maxTilt
          ? { rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }
          : undefined
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      className={`landing-interactive-card ${className}`}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
    >
      {maxTilt ? <span className="landing-card-shine pointer-events-none" aria-hidden /> : null}
      {children}
    </motion.div>
  );
};

export default LandingInteractiveCard;

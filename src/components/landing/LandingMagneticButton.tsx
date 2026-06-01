import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";
import { magneticStrength } from "@/lib/landingMotion";

type LandingMagneticButtonProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Subtle pointer-follow offset for primary CTAs (desktop, motion-safe).
 */
const LandingMagneticButton = ({ children, className = "" }: LandingMagneticButtonProps) => {
  const { profile, hoverLift } = useLandingMotionContext();
  const ref = useRef<HTMLDivElement>(null);
  const strength = magneticStrength(profile);
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const x = useSpring(offsetX, { stiffness: 320, damping: 28 });
  const y = useSpring(offsetY, { stiffness: 320, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!strength || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    offsetX.set(((e.clientX - cx) / rect.width) * strength);
    offsetY.set(((e.clientY - cy) / rect.height) * strength);
  };

  const reset = () => {
    offsetX.set(0);
    offsetY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={strength ? { x, y } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      whileHover={hoverLift}
      whileTap={profile.reduced ? undefined : { scale: 0.97 }}
    >
      {children}
    </motion.div>
  );
};

export default LandingMagneticButton;

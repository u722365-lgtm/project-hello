import { motion, useReducedMotion } from "framer-motion";

interface FloatingOrbsProps {
  /** Extra className applied to wrapper */
  className?: string;
}

export function FloatingOrbs({ className }: FloatingOrbsProps) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className={className}>
      <motion.div
        className="absolute top-14 left-10 h-[380px] w-[380px] rounded-full blur-[140px] bg-primary/10"
        animate={{ x: [0, 24, -10, 0], y: [0, -10, 18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 right-12 h-[320px] w-[320px] rounded-full blur-[120px] bg-secondary/10"
        animate={{ x: [0, -18, 12, 0], y: [0, 14, -12, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 h-[280px] w-[280px] rounded-full blur-[110px] bg-accent/10"
        animate={{ x: [0, 10, -16, 0], y: [0, 18, -8, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}


import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Strength of 3D tilt. Keep small for mobile comfort.
   * Default: 8
   */
  tilt?: number;
  /**
   * Spotlight size in px.
   * Default: 520
   */
  spotlightSize?: number;
}

export function SpotlightCard({
  children,
  className,
  tilt = 8,
  spotlightSize = 520,
}: SpotlightCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);

  const spotlight = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${x}px ${y}px, hsl(var(--primary) / 0.12), transparent 55%)`;

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        if (reduced || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
        opacity.set(1);
      }}
      onPointerLeave={() => {
        opacity.set(0);
      }}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={cn("relative", className)}
      style={
        reduced
          ? undefined
          : ({
              transformStyle: "preserve-3d",
            } as React.CSSProperties)
      }
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ backgroundImage: spotlight, opacity }}
      />
      <motion.div
        className="relative z-10"
        style={
          reduced
            ? undefined
            : ({
                transform: "translateZ(0px)",
              } as React.CSSProperties)
        }
      >
        {children}
      </motion.div>
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{ boxShadow: "0 0 0 1px hsl(var(--primary) / 0.12)" }}
        />
      )}
    </motion.div>
  );
}


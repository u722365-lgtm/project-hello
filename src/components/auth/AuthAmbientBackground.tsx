import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthAmbientBackgroundProps {
  className?: string;
  animate?: boolean;
  gridTransition?: Transition | false;
}

export function AuthAmbientBackground({
  className,
  animate = true,
  gridTransition,
}: AuthAmbientBackgroundProps) {
  if (!animate) {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <motion.div
        className="absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full blur-[130px] bg-primary/12"
        animate={{ x: [0, 40, -20, 0], y: [0, -24, 30, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full blur-[110px] bg-secondary/10"
        animate={{ x: [0, -28, 16, 0], y: [0, 20, -16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 h-[280px] w-[280px] rounded-full blur-[100px] bg-accent/8"
        animate={{ opacity: [0.4, 0.75, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        animate={
          gridTransition
            ? { backgroundPosition: ["0px 0px", "48px 48px"] }
            : undefined
        }
        transition={gridTransition || undefined}
      />

      <motion.div
        className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full border border-primary/10"
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/3 h-48 w-48 rounded-full border border-secondary/10"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/50"
          style={{
            left: `${12 + i * 18}%`,
            top: `${20 + (i % 3) * 22}%`,
          }}
          animate={{
            y: [0, -30 - i * 4, 0],
            opacity: [0, 0.9, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3.5 + i * 0.3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AuthAnimatedFieldProps {
  children: ReactNode;
  label: string;
  className?: string;
  reduced?: boolean;
  delay?: number;
}

export function AuthAnimatedField({
  children,
  label,
  className,
  reduced,
  delay = 0,
}: AuthAnimatedFieldProps) {
  return (
    <motion.div
      className={cn("group relative", className)}
      initial={reduced ? false : { opacity: 0, x: -12, filter: "blur(4px)" }}
      animate={reduced ? undefined : { opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { x: 2 }}
    >
      <motion.label
        className="mb-1.5 block text-xs font-medium text-muted-foreground"
        initial={false}
        whileHover={reduced ? undefined : { x: 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {label}
      </motion.label>
      <motion.div
        className="relative"
        whileFocusWithin={
          reduced
            ? undefined
            : { scale: 1.01, transition: { type: "spring", stiffness: 400, damping: 25 } }
        }
      >
        {!reduced && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-md opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--secondary) / 0.2), transparent)",
              filter: "blur(1px)",
            }}
            aria-hidden
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
          />
        )}
        <div className="relative">{children}</div>
      </motion.div>
    </motion.div>
  );
}

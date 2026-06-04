import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AuthAnimatedFieldProps {
  children: ReactNode;
  label: string;
  className?: string;
  reduced?: boolean;
}

export function AuthAnimatedField({
  children,
  label,
  className,
  reduced,
}: AuthAnimatedFieldProps) {
  return (
    <motion.div
      className={cn("group relative", className)}
      whileFocus={{ scale: reduced ? 1 : 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <motion.label
        className="text-xs font-medium text-muted-foreground mb-1.5 block"
        initial={false}
        whileHover={reduced ? undefined : { x: 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {label}
      </motion.label>
      <div className="relative">
        {!reduced && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--secondary) / 0.2), transparent)",
              filter: "blur(1px)",
            }}
            aria-hidden
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </motion.div>
  );
}

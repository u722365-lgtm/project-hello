import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type AuthShimmerButtonProps = ComponentProps<typeof Button> & {
  reduced?: boolean;
};

export function AuthShimmerButton({
  className,
  children,
  reduced,
  disabled,
  ...props
}: AuthShimmerButtonProps) {
  return (
    <motion.div
      className="relative w-full"
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        reduced || disabled
          ? undefined
          : {
              scale: 1.02,
              transition: { type: "spring", stiffness: 450, damping: 28 },
            }
      }
      whileTap={reduced || disabled ? undefined : { scale: 0.98 }}
    >
      {!reduced && !disabled && (
        <motion.span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
          aria-hidden
        >
          <motion.span
            className="absolute inset-y-0 w-1/3 opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary-foreground) / 0.5), transparent)",
            }}
            animate={{ left: ["-40%", "140%"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
          />
        </motion.span>
      )}
      <Button
        className={cn(
          "relative h-11 w-full overflow-hidden bg-gradient-to-r from-primary to-primary/80 font-medium text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.3)] hover:from-primary/90 hover:to-primary/70",
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}

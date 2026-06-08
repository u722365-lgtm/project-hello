import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type AuthTabKey = "email" | "phone" | "magiclink";

interface AuthModeTabsProps {
  tabs: { key: AuthTabKey; icon: ReactNode; label: string }[];
  active: AuthTabKey;
  onChange: (key: AuthTabKey) => void;
  reduced?: boolean;
}

export function AuthModeTabs({ tabs, active, onChange, reduced }: AuthModeTabsProps) {
  return (
    <motion.div
      className="relative mb-6 flex gap-1 overflow-hidden rounded-xl border border-border/20 bg-muted/30 p-1"
      initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {!reduced && (
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.15), transparent)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}
      {tabs.map((tab, index) => {
        const isActive = active === tab.key;
        return (
          <motion.button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + index * 0.06, duration: 0.35 }}
            whileHover={reduced ? undefined : { scale: isActive ? 1.02 : 1.04 }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
          >
            {isActive && !reduced && (
              <motion.span
                layoutId="auth-mode-pill"
                className="absolute inset-0 rounded-lg bg-primary shadow-[0_4px_20px_hsl(var(--primary)/0.35)]"
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            )}
            {isActive && reduced && (
              <span className="absolute inset-0 rounded-lg bg-primary shadow-sm" />
            )}
            <motion.span
              className="relative flex items-center gap-1.5"
              animate={reduced ? undefined : isActive ? { scale: [1, 1.05, 1] } : undefined}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
            >
              {tab.icon}
              {tab.label}
            </motion.span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

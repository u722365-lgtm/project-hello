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
    <div className="relative flex gap-1 p-1 bg-muted/30 rounded-xl mb-6 border border-border/20 overflow-hidden">
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
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors z-10",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
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
            <span className="relative flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

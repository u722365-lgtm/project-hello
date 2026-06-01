import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

export interface SettingsNavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

interface SettingsNavProps {
  sections: readonly SettingsNavSection[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SettingsNav({ sections, activeId, onSelect }: SettingsNavProps) {
  const { staggerItem, navSpring, isMobile } = useSettingsMotion();

  return (
    <>
      {/* Mobile: horizontal pill strip */}
      <nav
        className="lg:hidden -mx-1 mb-2 overflow-x-auto pb-2 scrollbar-none"
        aria-label="Settings sections"
      >
        <div className="flex gap-2 min-w-min px-1">
          {sections.map((item) => {
            const active = activeId === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition-colors",
                  active
                    ? "bg-primary/20 border-primary/40 text-foreground font-medium shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                    : "bg-muted/30 border-border/50 text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
                {item.label}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar (embedded in glass panel on SettingsPage) */}
      <nav className="hidden lg:block w-full" aria-label="Settings sections">
        <motion.ul
          className="space-y-1"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: isMobile ? 0 : 0.05 } },
          }}
        >
          {sections.map((item) => {
            const active = activeId === item.id;
            return (
              <motion.li key={item.id} variants={staggerItem}>
                <motion.button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  whileHover={{ x: active ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors overflow-hidden",
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="settings-nav-active"
                      className="absolute inset-0 rounded-xl bg-primary/12 border border-primary/25 shadow-[inset_0_1px_0_hsl(var(--primary)/0.2)]"
                      transition={navSpring}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      active ? "bg-primary/20 text-primary" : "bg-muted/40",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="relative z-10 flex-1 min-w-0">
                    <span className="block truncate">{item.label}</span>
                    <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                      {item.desc}
                    </span>
                  </span>
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-10"
                    >
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </motion.span>
                  )}
                </motion.button>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>
    </>
  );
}

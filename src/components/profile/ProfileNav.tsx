import { motion, LayoutGroup } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";

export interface ProfileNavTab {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  desc: string;
}

interface ProfileNavProps {
  tabs: readonly ProfileNavTab[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function ProfileNav({ tabs, activeId, onSelect }: ProfileNavProps) {
  const { staggerItem, navSpring, spring, isMobile } = useSettingsMotion();

  const select = (id: string) => {
    settingsHapticTick();
    onSelect(id);
  };

  return (
    <LayoutGroup id="profile-nav">
      <nav
        className="md:hidden -mx-1 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        aria-label="Profile sections"
      >
        <div className="flex gap-2 min-w-min px-1">
          {tabs.map((tab) => {
            const active = activeId === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                onClick={() => select(tab.id)}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                className={cn(
                  "relative shrink-0 snap-start flex items-center gap-2 rounded-full px-3.5 py-2 text-xs border",
                  active ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="profile-mobile-pill"
                    className="absolute inset-0 rounded-full bg-primary/20 border border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                    transition={navSpring}
                  />
                )}
                <tab.icon className={cn("relative z-10 h-3.5 w-3.5", active && "text-primary")} />
                <span className="relative z-10">{tab.shortLabel ?? tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      <nav className="hidden md:block w-full" aria-label="Profile sections">
        <motion.ul
          className="space-y-0.5"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: isMobile ? 0 : 0.04 } } }}
        >
          {tabs.map((tab, i) => {
            const active = activeId === tab.id;
            return (
              <motion.li key={tab.id} variants={staggerItem}>
                <motion.button
                  type="button"
                  onClick={() => select(tab.id)}
                  whileHover={active ? undefined : { x: 6 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  className={cn(
                    "relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="profile-nav-active"
                      className="absolute inset-0 rounded-xl bg-primary/12 border border-primary/25"
                      transition={navSpring}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-primary/25 text-primary" : "bg-muted/40",
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                  </span>
                  <span className="relative z-10 flex-1 min-w-0">
                    <span className="block truncate">{tab.label}</span>
                    <span className="block text-[10px] text-muted-foreground truncate">{tab.desc}</span>
                  </span>
                  <span className="relative z-10 text-[10px] font-mono text-muted-foreground/50">{i + 1}</span>
                  {active && (
                    <ChevronRight className="relative z-10 h-4 w-4 text-primary shrink-0" />
                  )}
                </motion.button>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>
    </LayoutGroup>
  );
}

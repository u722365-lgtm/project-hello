import { motion, LayoutGroup } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";

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
  const { staggerItem, navSpring, isMobile, spring } = useSettingsMotion();

  const handleSelect = (id: string) => {
    settingsHapticTick();
    onSelect(id);
  };

  return (
    <LayoutGroup id="settings-nav">
      <nav
        className="md:hidden -mx-1 mb-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        aria-label="Settings sections"
      >
        <div className="flex gap-2 min-w-min px-1">
          {sections.map((item) => {
            const active = activeId === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                className={cn(
                  "relative shrink-0 snap-start flex items-center gap-2 rounded-full px-4 py-2.5 text-sm border",
                  active ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="settings-mobile-pill"
                    className="absolute inset-0 rounded-full bg-primary/20 border border-primary/40 shadow-[0_0_24px_hsl(var(--primary)/0.2)]"
                    transition={navSpring}
                  />
                )}
                <item.icon className={cn("relative z-10 h-3.5 w-3.5", active && "text-primary")} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      <nav className="hidden md:block w-full" aria-label="Settings sections">
        <motion.ul
          className="space-y-0.5"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: isMobile ? 0 : 0.04 } },
          }}
        >
          {sections.map((item, i) => {
            const active = activeId === item.id;
            return (
              <motion.li key={item.id} variants={staggerItem}>
                <motion.button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  whileHover={active ? undefined : { x: 6 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  className={cn(
                    "relative w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm overflow-hidden",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="settings-nav-active"
                      className="absolute inset-0 rounded-xl bg-primary/12 border border-primary/25 shadow-[inset_0_1px_0_hsl(var(--primary)/0.25)]"
                      transition={navSpring}
                    />
                  )}
                  <motion.span
                    className={cn(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-primary/25 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.2)]" : "bg-muted/40",
                    )}
                    animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <item.icon className="h-4 w-4" />
                  </motion.span>
                  <span className="relative z-10 flex-1 min-w-0">
                    <span className="block truncate">{item.label}</span>
                    <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                      {item.desc}
                    </span>
                  </span>
                  <span className="relative z-10 w-5 text-[10px] font-mono text-muted-foreground/60 tabular-nums">
                    {i + 1}
                  </span>
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={spring}
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
    </LayoutGroup>
  );
}

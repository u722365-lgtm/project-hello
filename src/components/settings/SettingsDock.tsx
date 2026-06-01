import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import type { SettingsNavSection } from "@/components/settings/SettingsNav";

interface SettingsDockProps {
  sections: readonly SettingsNavSection[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SettingsDock({ sections, activeId, onSelect }: SettingsDockProps) {
  const { dockItem, navSpring, reduced } = useSettingsMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, ...navSpring }}
      className="hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      <div
        className={cn(
          "flex items-center gap-1 p-1.5 rounded-2xl",
          "border border-border/50 glass-strong shadow-elevated",
          "backdrop-blur-2xl",
        )}
      >
        {sections.map((item) => {
          const active = activeId === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onSelect(item.id)}
              variants={dockItem}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="settings-dock-active"
                  className="absolute inset-0 rounded-xl bg-primary/15 border border-primary/30"
                  transition={navSpring}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              {!reduced && active && (
                <motion.span
                  layoutId="settings-dock-glow"
                  className="absolute inset-0 rounded-xl shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                  transition={navSpring}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

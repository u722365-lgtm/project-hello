import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function SettingsSectionHeader({ title, description, icon: Icon }: SettingsSectionHeaderProps) {
  const { staggerItem } = useSettingsMotion();

  return (
    <motion.header variants={staggerItem} className="space-y-1.5 pb-1">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <motion.span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/25"
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Icon className="h-4 w-4 text-primary" />
          </motion.span>
        )}
        <h2 className="text-xl font-semibold tracking-tight">
          <span className="gradient-text">{title}</span>
        </h2>
      </div>
      <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{description}</p>
    </motion.header>
  );
}

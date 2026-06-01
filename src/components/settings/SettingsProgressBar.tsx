import { motion } from "framer-motion";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

interface SettingsProgressBarProps {
  progress: number;
  sectionLabel: string;
}

export function SettingsProgressBar({ progress, sectionLabel }: SettingsProgressBarProps) {
  const { springSnappy, reduced } = useSettingsMotion();

  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-medium tracking-wide uppercase opacity-80">Workspace setup</span>
        <span>{sectionLabel}</span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
          initial={false}
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={reduced ? { duration: 0.01 } : springSnappy}
        />
      </div>
    </div>
  );
}

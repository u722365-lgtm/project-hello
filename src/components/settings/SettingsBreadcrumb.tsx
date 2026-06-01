import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsBreadcrumbProps {
  sectionLabel: string;
  onHome?: () => void;
  className?: string;
}

export function SettingsBreadcrumb({ sectionLabel, onHome, className }: SettingsBreadcrumbProps) {
  return (
    <motion.nav
      aria-label="Breadcrumb"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex items-center gap-1.5 text-xs text-muted-foreground mb-4", className)}
    >
      {onHome ? (
        <button
          type="button"
          onClick={onHome}
          className="inline-flex items-center gap-1 hover:text-primary transition-colors rounded-md px-1.5 py-0.5 -ml-1.5"
        >
          <Home className="h-3.5 w-3.5" />
          Settings
        </button>
      ) : (
        <span className="inline-flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          Settings
        </span>
      )}
      <ChevronRight className="h-3 w-3 opacity-50" />
      <span className="text-foreground font-medium">{sectionLabel}</span>
    </motion.nav>
  );
}

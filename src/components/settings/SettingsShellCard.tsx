import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

interface SettingsShellCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  highlight?: boolean;
}

export function SettingsShellCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
  highlight,
}: SettingsShellCardProps) {
  const { reduced, spring } = useSettingsMotion();

  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -4, scale: 1.005 }}
      whileTap={reduced ? undefined : { scale: 0.995 }}
      transition={spring}
      className={cn("group relative settings-panel-shine", className)}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100",
          highlight
            ? "bg-gradient-to-br from-primary/45 via-secondary/25 to-transparent"
            : "bg-gradient-to-br from-primary/30 via-transparent to-accent/15",
        )}
      />
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100"
          initial={false}
        >
          <motion.div
            className="absolute -inset-y-4 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.5 }}
          />
        </motion.div>
      )}
      <Card
        className={cn(
          "relative glass border-border/50 card-glass overflow-hidden rounded-2xl",
          highlight && "ring-1 ring-primary/30",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            {Icon && (
              <motion.span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/20"
                whileHover={{ rotate: [0, -6, 6, 0], scale: 1.06 }}
                transition={{ duration: 0.45 }}
              >
                <Icon className="h-4 w-4 text-primary" />
              </motion.span>
            )}
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

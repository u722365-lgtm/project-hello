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
  const { reduced } = useSettingsMotion();

  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={cn("group relative", className)}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          highlight
            ? "bg-gradient-to-br from-primary/40 via-secondary/20 to-transparent"
            : "bg-gradient-to-br from-primary/25 via-transparent to-accent/10",
        )}
      />
      <Card
        className={cn(
          "relative glass border-border/50 card-glass overflow-hidden rounded-2xl",
          highlight && "ring-1 ring-primary/25",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-60" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            {Icon && (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
                <Icon className="h-4 w-4 text-primary" />
              </span>
            )}
            {title}
          </CardTitle>
          {description && <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>}
        </CardHeader>
        <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

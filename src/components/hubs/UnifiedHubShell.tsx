import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import type { PageMeta } from "@/lib/seo";
import type { ReactNode } from "react";

export interface HubMode<T extends string> {
  id: T;
  label: string;
  description?: string;
  icon: ReactNode;
  badge?: string;
}

interface UnifiedHubShellProps<T extends string> {
  title: string;
  subtitle: string;
  badge?: string;
  modes: HubMode<T>[];
  activeMode: T;
  onModeChange: (mode: T) => void;
  children: ReactNode;
  seo?: PageMeta;
}

export function UnifiedHubShell<T extends string>({
  title,
  subtitle,
  badge = "Unified",
  modes,
  activeMode,
  onModeChange,
  children,
  seo,
}: UnifiedHubShellProps<T>) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {seo && <SEOHead meta={seo} />}
      <Navigation />
      <div className="pt-16 flex flex-col flex-1 min-h-0">
        <div className="border-b border-border px-4 py-3 bg-card/60 backdrop-blur shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2">
                {title}
                <Badge variant="secondary" className="text-[10px] font-normal">{badge}</Badge>
              </h1>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 overflow-x-auto">
              {modes.map((m) => {
                const active = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onModeChange(m.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                      active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`hub-pill-${title}`}
                        className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                        transition={{ type: "spring", stiffness: 480, damping: 36 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {m.icon}
                      {m.label}
                      {m.badge && (
                        <span className="text-[9px] opacity-70">{m.badge}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { PROACTIVE_ETHICS } from "@/lib/ethicalGrowth";

type ProactiveOptInPromptProps = {
  onEnable: () => void;
  onDismiss: () => void;
  className?: string;
};

export function ProactiveOptInPrompt({ onEnable, onDismiss, className = "" }: ProactiveOptInPromptProps) {
  return (
    <div
      className={`max-w-[320px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl p-4 shadow-xl ${className}`}
      role="dialog"
      aria-label={PROACTIVE_ETHICS.enableTitle}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {PROACTIVE_ETHICS.label}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{PROACTIVE_ETHICS.enableTitle}</p>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{PROACTIVE_ETHICS.enableBody}</p>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onEnable}>
          Enable suggestions
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {PROACTIVE_ETHICS.dismiss}
        </Button>
      </div>
    </div>
  );
}

export default ProactiveOptInPrompt;

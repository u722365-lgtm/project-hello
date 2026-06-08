import { ArrowLeft, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

export function TerminalBrutalistDesign({ children, compact, showBack, onBack }: Props) {
  return (
    <div className="relative min-h-full bg-black font-mono text-green-400">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_75%)]" />

      <div className={compact ? "p-3" : "mx-auto max-w-lg p-4 sm:p-8"}>
        {showBack && onBack && !compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> ../gallery
          </Button>
        )}

        <div
          className={
            compact
              ? "rounded border border-amber-500/40 bg-black/90 p-3 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
              : "rounded-lg border-2 border-amber-500/50 bg-black/95 p-6 shadow-[0_0_40px_rgba(251,191,36,0.12)]"
          }
        >
          <div className="mb-4 flex items-center gap-2 border-b border-amber-500/30 pb-3 text-amber-400">
            <Terminal className="h-4 w-4" />
            <span className={compact ? "text-[10px]" : "text-xs"}>shadowtalk-auth --session</span>
            <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-green-500" />
          </div>
          <div className="[&_input]:font-mono [&_input]:border-amber-500/30 [&_input]:bg-black/80 [&_input]:text-green-300 [&_label]:font-mono [&_label]:text-amber-400/80 [&_button]:font-mono [&_h2]:font-mono [&_h2]:text-amber-100 [&_p]:font-mono [&_p]:text-green-500/70">
            {children}
          </div>
          {!compact && (
            <p className="mt-4 text-[10px] text-green-600/60">
              {">"} awaiting credentials... type 'help' for sovereign mode docs
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

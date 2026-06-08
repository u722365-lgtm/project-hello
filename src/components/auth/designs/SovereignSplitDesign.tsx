import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

export function SovereignSplitDesign({ children, compact, showBack, onBack }: Props) {
  if (compact) {
    return (
      <div className="flex min-h-full overflow-hidden rounded-xl border border-amber-500/20 bg-zinc-950">
        <div className="w-[38%] bg-gradient-to-br from-amber-600/30 to-emerald-600/20 p-3 flex flex-col justify-end">
          <Shield className="h-4 w-4 text-amber-400" />
          <p className="mt-1 text-[9px] font-bold text-foreground">Sovereign</p>
        </div>
        <div className="flex flex-1 items-center p-3 bg-zinc-950/90">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-amber-600/25 via-zinc-900 to-emerald-700/20 p-8 lg:p-12">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(245,158,11,0.3), transparent 50%)" }} />
        {showBack && onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="relative z-10 w-fit text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to gallery
          </Button>
        )}
        <div className="relative z-10 mt-auto lg:mt-0">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">{BRAND.mnemonic}</h1>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Sovereign AI workspace. Your keys, your models, your missions — encrypted end-to-end.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">
            <span className="rounded border border-amber-500/30 px-2 py-1">AES-256</span>
            <span className="rounded border border-emerald-500/30 px-2 py-1">Zero-knowledge</span>
            <span className="rounded border border-amber-500/30 px-2 py-1">On-device</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-zinc-950 p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

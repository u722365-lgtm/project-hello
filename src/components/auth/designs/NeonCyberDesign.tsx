import { ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

export function NeonCyberDesign({ children, compact, showBack, onBack }: Props) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#050508]">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,0,255,0.15) 1px, transparent 1px),
            linear-gradient(rgba(0,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />

      <div className={compact ? "p-3" : "flex min-h-full items-center justify-center p-6"}>
        <div className="relative w-full">
          {showBack && onBack && !compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute -top-12 left-0 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> EXIT_GALLERY
            </Button>
          )}

          <div className="relative">
            <div
              className={
                compact
                  ? "absolute -inset-0.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-cyan-500 opacity-70 blur-sm"
                  : "absolute -inset-1 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 opacity-80 blur-md"
              }
            />
            <div
              className={
                compact
                  ? "relative rounded-lg border border-fuchsia-500/50 bg-[#0a0a12] p-4"
                  : "relative mx-auto max-w-md rounded-2xl border border-cyan-500/40 bg-[#0a0a12] p-8"
              }
            >
              <div className="mb-4 flex items-center gap-2 text-cyan-400">
                <Zap className="h-4 w-4" />
                <span className={compact ? "text-[9px] font-bold tracking-widest" : "text-xs font-bold tracking-[0.3em]"}>
                  SHADOWTALK // AUTH
                </span>
              </div>
              <div className="[&_h2]:text-fuchsia-100 [&_button]:border-fuchsia-500/50 [&_input]:border-cyan-500/30 [&_input]:bg-black/60">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

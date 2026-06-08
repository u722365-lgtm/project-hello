import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

export function GlassMonolithDesign({ children, compact, showBack, onBack }: Props) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 p-4">
      <motion.div
        className="pointer-events-none absolute left-1/4 top-1/4 h-56 w-56 rounded-full bg-violet-500/25 blur-[90px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-sky-400/20 blur-[70px]"
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="relative z-10 w-full">
        {showBack && onBack && !compact && (
          <Button variant="ghost" size="sm" onClick={onBack} className="absolute -top-12 left-0 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            compact
              ? "rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-2xl"
              : "mx-auto max-w-md rounded-3xl border border-white/15 bg-white/[0.06] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          }
        >
          <div className="mb-4 text-center">
            <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-gradient-to-r from-violet-400 to-sky-400" />
            {!compact && (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">ShadowTalk</p>
            )}
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

export function AuroraFlowDesign({ children, compact, showBack, onBack }: Props) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-slate-950 p-4">
      <motion.div
        className="pointer-events-none absolute -left-1/4 top-0 h-[120%] w-[80%] opacity-60"
        style={{
          background: "conic-gradient(from 180deg at 50% 50%, #6366f1 0deg, #ec4899 120deg, #38bdf8 240deg, #6366f1 360deg)",
          filter: "blur(80px)",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/70 backdrop-blur-3xl" />

      <div className="relative z-10 w-full">
        {showBack && onBack && !compact && (
          <Button variant="ghost" size="sm" onClick={onBack} className="absolute -top-12 left-0 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={
            compact
              ? "rounded-[1.25rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl"
              : "mx-auto max-w-md rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/12 to-white/5 p-8 shadow-2xl backdrop-blur-xl"
          }
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-300" />
            {!compact && <span className="text-sm font-medium text-white/80">Welcome to ShadowTalk</span>}
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

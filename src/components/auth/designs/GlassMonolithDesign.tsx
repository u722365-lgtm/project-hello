import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { AuthFloatingParticles } from "@/components/auth/AuthFloatingParticles";
import { useAuthMotion } from "@/hooks/useAuthMotion";

type Props = {
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
};

export function GlassMonolithDesign({
  children,
  compact,
  showBack,
  onBack,
  backLabel = "Back to Home",
}: Props) {
  const { reduced, variants, glassFloat, shouldAnimateAmbient } = useAuthMotion();

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 px-3 py-5 sm:p-6 ${
        compact ? "min-h-full" : "min-h-screen"
      }`}
    >
      <AuthFloatingParticles disabled={reduced || compact} />

      <motion.div
        className="pointer-events-none absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-violet-500/25 blur-[70px] sm:h-56 sm:w-56 sm:blur-[90px]"
        animate={
          shouldAnimateAmbient
            ? { x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }
            : undefined
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-36 w-36 rounded-full bg-sky-400/20 blur-[56px] sm:h-48 sm:w-48 sm:blur-[70px]"
        animate={
          shouldAnimateAmbient
            ? { x: [0, -25, 0], y: [0, 15, 0], scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }
            : undefined
        }
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[72px] sm:h-72 sm:w-72 sm:blur-[100px]"
        animate={
          shouldAnimateAmbient
            ? { scale: [1, 1.25, 1], opacity: [0.1, 0.22, 0.1] }
            : undefined
        }
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="relative z-10 w-full min-w-0">
        {showBack && onBack && !compact && (
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -12 }}
            animate={reduced ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute -top-12 left-0 max-w-[calc(100vw-1.5rem)] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
            </Button>
          </motion.div>
        )}

        <motion.div
          variants={variants.glassCard}
          initial="hidden"
          animate="visible"
          className={compact ? "w-full min-w-0" : "mx-auto w-full max-w-md min-w-0"}
        >
          <div className="relative w-full min-w-0 overflow-hidden rounded-3xl p-[1px]">
            {shouldAnimateAmbient && (
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-3xl opacity-70"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(167,139,250,0.5), rgba(56,189,248,0.5), rgba(232,121,249,0.5))",
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
            )}
            <motion.div
              animate={glassFloat}
              className={
                compact
                  ? "relative min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-2xl"
                  : "relative min-w-0 rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8"
              }
            >
              <motion.div
                className="mb-4 text-center"
                variants={variants.headerStagger}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={variants.headerItem}
                  className="mx-auto mb-2 h-1 w-12 rounded-full bg-gradient-to-r from-violet-400 to-sky-400"
                  animate={
                    shouldAnimateAmbient
                      ? { scaleX: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }
                      : undefined
                  }
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                {!compact && (
                  <motion.p
                    variants={variants.headerItem}
                    className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground sm:tracking-[0.2em]"
                  >
                    ShadowTalk
                  </motion.p>
                )}
              </motion.div>
              {children}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

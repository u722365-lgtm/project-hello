import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import shadowRobotImg from "@/assets/shadow-robot.png";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

export function NeuralVoidDesign({ children, compact, showBack, onBack }: Props) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-[#06060a] lg:flex-row">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(hsl(330 80% 60% / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsl(180 70% 45% / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: compact ? "24px 24px" : "48px 48px",
        }}
      />
      <motion.div
        className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-pink-500/20 blur-[100px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute -right-10 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/20 blur-[80px]"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center p-4 sm:p-6 lg:p-10">
        {showBack && onBack && !compact && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 w-fit text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to gallery
          </Button>
        )}
        <div
          className={
            compact
              ? "rounded-xl border border-pink-500/20 bg-card/50 p-4 backdrop-blur-xl"
              : "mx-auto w-full max-w-md rounded-2xl border border-pink-500/25 bg-card/40 p-6 shadow-[0_8px_40px_rgba(236,72,153,0.12)] backdrop-blur-xl sm:p-8"
          }
        >
          {children}
        </div>
      </div>

      {!compact && (
        <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden lg:flex">
          <motion.img
            src={shadowRobotImg}
            alt=""
            className="relative z-10 w-72 object-contain"
            animate={{ y: [0, -12, 0], filter: ["drop-shadow(0 0 30px rgba(236,72,153,0.3))", "drop-shadow(0 0 50px rgba(20,184,166,0.4))", "drop-shadow(0 0 30px rgba(236,72,153,0.3))"] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <p className="relative z-10 mt-4 text-center text-sm font-medium text-muted-foreground">
            Your AI Guardian · Zero-knowledge by default
          </p>
        </div>
      )}
    </div>
  );
}

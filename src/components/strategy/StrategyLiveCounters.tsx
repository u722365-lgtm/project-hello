import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Sparkles, Clock } from "lucide-react";
import type { StrategyPlanStep } from "@/lib/strategy/types";

interface Props {
  steps: StrategyPlanStep[];
  running: boolean;
  startedAt: number | null;
}

/**
 * Live counters shown while the Strategy Agent runs — designed for demo screenshots and ads.
 */
export const StrategyLiveCounters = ({ steps, running, startedAt }: Props) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running || !startedAt) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(id);
  }, [running, startedAt]);

  const sources = steps.reduce((acc, s) => {
    if (s.status !== "completed") return acc;
    const text = String(s.result ?? "");
    const urls = text.match(/https?:\/\/[^\s"')]+/g);
    return acc + (urls?.length ?? 0);
  }, 0);
  const signals = steps.reduce((acc, s) => {
    if (s.status !== "completed") return acc;
    return acc + Math.min(20, Math.round(String(s.result ?? "").length / 400));
  }, 0);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (!running && steps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.4 }}
      className="grid grid-cols-3 gap-3"
    >
      <Counter icon={<Globe className="h-4 w-4" />} label="Sources analyzed" value={sources} />
      <Counter icon={<Sparkles className="h-4 w-4" />} label="Signals extracted" value={signals} />
      <Counter icon={<Clock className="h-4 w-4" />} label="Elapsed" value={`${mm}:${ss}`} />
    </motion.div>
  );
};

const Counter = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon} {label}</div>
    <div className="text-2xl font-bold tabular-nums">{value}</div>
  </div>
);

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Share2, Trophy, Target, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StrategyResult, BusinessIdea, StrategyPlanStep } from "@/lib/strategy/types";

interface Props {
  idea: BusinessIdea;
  result: StrategyResult;
  steps: StrategyPlanStep[];
  elapsedSec: number;
  onShare?: () => void;
  partial?: boolean;
}

function computeScore(result: StrategyResult, steps: StrategyPlanStep[]): number {
  let score = 45;
  score += Math.min(20, (result.research?.sources?.length ?? 0) * 2);
  score += Math.min(10, (result.swot?.strengths?.length ?? 0) * 2);
  score += Math.min(10, (result.swot?.opportunities?.length ?? 0) * 2);
  score += Math.min(8, (result.recommendations?.length ?? 0));
  score += Math.min(7, steps.filter((s) => s.status === "completed").length);
  return Math.max(35, Math.min(99, score));
}

export const StrategyHeroScore = ({ idea, result, steps, elapsedSec, onShare, partial }: Props) => {
  const score = useMemo(() => computeScore(result, steps), [result, steps]);
  const sources = result.research?.sources?.length ?? 0;
  const recs = result.recommendations?.length ?? 0;
  const swotTotal =
    (result.swot?.strengths?.length ?? 0) +
    (result.swot?.weaknesses?.length ?? 0) +
    (result.swot?.opportunities?.length ?? 0) +
    (result.swot?.threats?.length ?? 0);

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white">
        <div className="p-6 md:p-8 grid md:grid-cols-[auto,1fr,auto] items-center gap-6">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/30">
              <div className="text-center">
                <div className="text-5xl font-bold tabular-nums leading-none">{score}</div>
                <div className="text-[10px] uppercase tracking-widest mt-1 opacity-80">/ 100</div>
              </div>
            </div>
            <div className="mt-2 text-xs uppercase tracking-wider opacity-80 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> Strategy Score
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-70">Strategy for</div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">{idea.name || "Your Business"}</h2>
              <p className="text-sm opacity-90 mt-1">
                {idea.industry} · {idea.location}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat icon={<Target className="h-3.5 w-3.5" />} label="Sources" value={sources} />
              <Stat icon={<Zap className="h-3.5 w-3.5" />} label="SWOT points" value={swotTotal} />
              <Stat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Recommendations" value={recs} />
              <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Runtime" value={`${mm}:${ss}`} />
            </div>
            {partial && (
              <div className="text-xs bg-amber-400/20 border border-amber-300/40 rounded px-3 py-1.5 inline-block">
                Partial data — retry to fill remaining sources.
              </div>
            )}
          </div>

          {onShare && (
            <Button
              onClick={onShare}
              size="lg"
              className="bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-lg"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share strategy
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider opacity-80 flex items-center gap-1">{icon} {label}</div>
    <div className="text-lg font-bold tabular-nums">{value}</div>
  </div>
);

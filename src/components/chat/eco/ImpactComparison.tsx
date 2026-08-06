import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Award, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { backend } from '@/integrations/local/client';

interface ImpactComparisonProps {
  co2Saved: number;
  actionsCompleted: number;
  streak: number;
  level: number;
}

const getPercentile = (value: number, avg: number): number => {
  if (value <= 0) return 0;
  // Simple sigmoid-based percentile estimation
  const ratio = value / Math.max(avg, 1);
  const percentile = Math.min(99, Math.floor(100 / (1 + Math.exp(-2 * (ratio - 1)))));
  return Math.max(1, percentile);
};

const ImpactComparison: React.FC<ImpactComparisonProps> = ({ co2Saved, actionsCompleted, streak, level }) => {
  const [communityAvg, setCommunityAvg] = useState<{ co2: number; actions: number; streak: number; level: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await backend
          .from('eco_stats')
          .select('co2_saved, actions_completed, streak, level')
          .order('updated_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        const rows = (data ?? []).filter(Boolean);
        if (!rows.length) return;

        const sums = rows.reduce(
          (acc, r: any) => {
            acc.co2 += Number(r.co2_saved ?? 0);
            acc.actions += Number(r.actions_completed ?? 0);
            acc.streak += Number(r.streak ?? 0);
            acc.level += Number(r.level ?? 0);
            return acc;
          },
          { co2: 0, actions: 0, streak: 0, level: 0 },
        );

        const avg = {
          co2: sums.co2 / rows.length,
          actions: sums.actions / rows.length,
          streak: sums.streak / rows.length,
          level: sums.level / rows.length,
        };

        if (!cancelled) setCommunityAvg(avg);
      } catch (e) {
        // Best-effort: if RLS blocks or table missing, we keep comparison UI but fall back to personal baseline.
        if (!cancelled) setCommunityAvg(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const baseline = useMemo(() => {
    if (communityAvg) return communityAvg;
    return {
      co2: Math.max(1, co2Saved),
      actions: Math.max(1, actionsCompleted),
      streak: Math.max(1, streak),
      level: Math.max(1, level),
    };
  }, [communityAvg, co2Saved, actionsCompleted, streak, level]);

  const comparisons = useMemo(() => ([
    {
      label: 'CO₂ Savings',
      percentile: getPercentile(co2Saved, baseline.co2),
      yours: `${co2Saved.toFixed(1)}kg`,
      avg: `${baseline.co2.toFixed(1)}kg`,
      better: co2Saved > baseline.co2,
    },
    {
      label: 'Actions Done',
      percentile: getPercentile(actionsCompleted, baseline.actions),
      yours: `${actionsCompleted}`,
      avg: `${baseline.actions.toFixed(0)}`,
      better: actionsCompleted > baseline.actions,
    },
    {
      label: 'Streak',
      percentile: getPercentile(streak, baseline.streak),
      yours: `${streak} days`,
      avg: `${baseline.streak.toFixed(0)} days`,
      better: streak > baseline.streak,
    },
  ]), [actionsCompleted, baseline.actions, baseline.co2, baseline.streak, co2Saved, streak]);

  const overallPercentile = Math.round(
    comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length
  );

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Your Impact vs Community</span>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Award className="h-3 w-3" />
            Top {100 - overallPercentile}%
          </Badge>
        </div>

        {/* Overall Percentile Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg"
        >
          <p className="text-3xl font-black text-primary">{overallPercentile}th</p>
          <p className="text-xs text-muted-foreground">percentile overall</p>
          {overallPercentile > 50 && (
            <p className="text-[10px] text-green-500 mt-1 flex items-center justify-center gap-1">
              <ArrowUp className="h-3 w-3" />
              You're doing better than {overallPercentile}% of eco warriors!
            </p>
          )}
        </motion.div>

        {/* Individual Comparisons */}
        <div className="space-y-2">
          {comparisons.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className={c.better ? 'text-green-500' : 'text-muted-foreground'}>
                    {c.yours} vs avg {c.avg}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.better ? 'bg-green-500' : 'bg-yellow-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.percentile}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                  />
                </div>
              </div>
              <span className={`text-xs font-bold min-w-[40px] text-right ${c.better ? 'text-green-500' : 'text-yellow-500'}`}>
                {c.percentile}%
              </span>
            </motion.div>
          ))}
        </div>

        {overallPercentile < 50 && (
          <p className="text-xs text-center text-muted-foreground">
            Complete more actions to climb the ranks! 💪
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ImpactComparison;

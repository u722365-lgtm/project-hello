import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Activity,
  Users,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type RankRow = {
  rank: number;
  name: string;
  score: number;
  delta: number;
  trend: 'up' | 'down' | 'same';
};

const DEMO_ROWS: RankRow[] = [
  { rank: 1, name: 'Northwind', score: 94, delta: 4, trend: 'up' },
  { rank: 2, name: 'Orion', score: 91, delta: 2, trend: 'up' },
  { rank: 3, name: 'BuildPath', score: 89, delta: 0, trend: 'same' },
  { rank: 4, name: 'Medient Labs', score: 85, delta: 3, trend: 'down' },
  { rank: 5, name: 'Axis Retail', score: 82, delta: 5, trend: 'up' },
  { rank: 6, name: 'Cinder', score: 77, delta: 1, trend: 'down' },
  { rank: 7, name: 'Nimbus', score: 74, delta: 2, trend: 'same' },
  { rank: 8, name: 'Skyline AI', score: 71, delta: 1, trend: 'up' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const LeagueIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className='h-4 w-4 text-amber-400' />;
  if (rank <= 3) return <Medal className='h-4 w-4 text-amber-300' />;
  if (rank <= 6) return <Crown className='h-4 w-4 text-primary' />;
  return <Crown className='h-4 w-4 text-muted-foreground' />;
};

const LeaderboardPage = () => {
  const [view, setView] = useState<'weekly' | 'monthly' | 'lifetime'>('weekly');

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <main className='container mx-auto px-4 pt-24 pb-16 max-w-5xl'>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6'>
            <div>
              <span className='inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-xs text-muted-foreground border border-border/50 mb-3'>
                <Flame className='h-3.5 w-3.5 text-primary' />
                Competitive view
              </span>
              <h1 className='text-4xl font-bold tracking-tight'>
                <span className='gradient-text'>Leaderboard</span>
              </h1>
              <p className='text-muted-foreground mt-1'>
                Rank among active enterprise pilots for readiness, engagement, and value delivered.
              </p>
            </div>
            <div className='flex items-center gap-2 rounded-xl border border-border/50 glass-subtle p-1'>
              {(['weekly', 'monthly', 'lifetime'] as const).map((item) => (
                <Button
                  key={item}
                  size='sm'
                  variant={view === item ? 'default' : 'ghost'}
                  className='rounded-lg'
                  onClick={() => setView(item)}
                >
                  {item === 'weekly' ? '7D' : item === 'monthly' ? '30D' : 'LTD'}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          {[
            { label: 'Top mover', value: 'AntiShip â†—', detail: '+9 pts this week', icon: ArrowUpRight },
            { label: 'Retention cohort', value: '94%', detail: 'Enterprise pilots', icon: Users },
            { label: 'Avg readiness', value: '84', detail: 'Across pilots', icon: Star },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                custom={i * 0.08}
                initial='hidden'
                animate='visible'
                variants={fadeUp}
              >
                <Card className='glass-subtle'>
                  <CardContent className='p-5'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs text-muted-foreground'>{kpi.label}</span>
                      <span className='rounded-lg bg-primary/10 p-2 text-primary'>
                        <Icon className='h-4 w-4' />
                      </span>
                    </div>
                    <p className='text-2xl font-bold'>{kpi.value}</p>
                    <p className='text-xs text-muted-foreground mt-1'>{kpi.detail}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className='glass-subtle'>
          <CardHeader>
            <CardTitle>All pilots</CardTitle>
          </CardHeader>
          <CardContent className='p-0 sm:p-6'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='text-left text-muted-foreground'>
                    <th className='p-3 font-medium'>Rank</th>
                    <th className='p-3 font-medium'>Company</th>
                    <th className='p-3 font-medium text-right'>Score</th>
                    <th className='p-3 font-medium text-right'>Trend</th>
                    <th className='p-3 font-medium text-right hidden sm:table-cell'>League</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ROWS.map((row) => (
                    <tr
                      key={row.rank}
                      className={`border-t border-border/50 ${
                        row.rank <= 3 ? 'bg-primary/5' : row.rank <= 6 ? 'bg-muted/30' : ''
                      }`}
                    >
                      <td className='p-3 font-semibold'>#{row.rank}</td>
                      <td className='p-3 flex items-center gap-2'>
                        <Activity className='h-4 w-4 text-primary/70' />
                        <span className='font-medium'>{row.name}</span>
                      </td>
                      <td className='p-3 text-right font-mono'>{row.score}</td>
                      <td className='p-3 text-right'>
                        <span
                          className={
                            row.trend === 'up'
                              ? 'text-green-500'
                              : row.trend === 'down'
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                          }
                        >
                          {row.trend === 'up' ? '+' : row.trend === 'down' ? '-' : '='} {row.delta}
                        </span>
                      </td>
                      <td className='p-3 text-right hidden sm:table-cell'>
                        <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                          <LeagueIcon rank={row.rank} />
                          {row.rank <= 3 ? 'Premier' : row.rank <= 6 ? 'Elite' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default LeaderboardPage;

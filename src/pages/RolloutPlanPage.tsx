import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Rocket,
  Target,
  Calendar,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type Phase = {
  name: string;
  eta: string;
  impact: string;
  owner: string;
  status: 'on-track' | 'at-risk' | 'done';
};

const ROADMAP: Phase[] = [
  { name: 'Pilot onboarding', eta: 'This week', impact: '18 pilots', owner: 'Ava', status: 'on-track' },
  { name: 'Voice frontline', eta: 'Next week', impact: 'Engagement +24%', owner: 'Jay', status: 'on-track' },
  { name: 'fallback', eta: 'Week 4', impact: 'Reliability', owner: 'Mina', status: 'at-risk' },
  { name: 'APAC launch', eta: 'Month 2', impact: 'Market expand', owner: 'Kai', status: 'on-track' },
  { name: 'BYOK/Compliance', eta: 'Month 2', impact: 'Deal enablement', owner: 'Sarah', status: 'done' },
  { name: 'Marketplace', eta: 'Month 3', impact: 'Discovery/revenue', owner: 'Ava', status: 'on-track' },
];

const SUPPORT_ROWS = [
  { item: 'Customers', need: 'Account access', owner: 'Support', sla: '4h', decision: 'Auto-approved' },
  { item: 'Compliance', need: 'Data export', owner: 'Legal', sla: '8h', decision: 'Review only' },
  { item: 'Integrations', need: 'Partner API', owner: 'Growth', sla: '2h', decision: 'Auto-approved' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const RolloutPlanPage = () => {
  const today = useMemo(() => new Date().toLocaleDateString(), []);
  const completion = useMemo(() => {
    const total = ROADMAP.length;
    const done = ROADMAP.filter((r) => r.status === 'done').length;
    return total ? Math.round((done / total) * 100) : 0;
  }, []);

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <main className='container mx-auto px-4 pt-24 pb-16 max-w-6xl'>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8'>
            <div>
              <span className='inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-xs text-muted-foreground border border-border/50 mb-3'>
                <Target className='h-3.5 w-3.5 text-primary' />
                Execution view
              </span>
              <h1 className='text-4xl font-bold tracking-tight'>
                Rollout <span className='gradient-text'>Plan</span>
              </h1>
              <p className='text-muted-foreground mt-1'>
                CEO roadmap with status, gating decisions, and support model. As of {today}.
              </p>
            </div>
            <Button variant='outline' className='glass-subtle border-border/40'>
              <Calendar className='h-4 w-4 mr-2' />
              Export plan
            </Button>
          </div>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          {[
            { label: 'Completion', value: `${completion}%`, detail: 'Current milestone', icon: CheckCircle2 },
            { label: 'On track', value: '5', detail: 'Active milestones', icon: Rocket },
            { label: 'At risk', value: '1', detail: 'Needs attention', icon: ShieldCheck },
            { label: 'Avg ETA', value: '3w', detail: 'To next release', icon: Calendar },
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
                    <Progress className='mt-3 h-1.5' value={kpi.label === 'Completion' ? Number.parseFloat(kpi.value) : i === 1 ? 72 : i === 2 ? 28 : 45} />
                    <p className='text-xs text-muted-foreground mt-2'>{kpi.detail}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-4'>
            {ROADMAP.map((phase, i) => (
              <motion.div
                key={phase.name}
                custom={i * 0.06}
                initial='hidden'
                animate='visible'
                variants={fadeUp}
              >
                <Card className='glass-subtle'>
                  <CardContent className='p-5'>
                    <div className='flex items-start justify-between gap-3 mb-3'>
                      <div>
                        <p className='font-semibold text-sm'>{phase.name}</p>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          Owner: {phase.owner} • ETA: {phase.eta}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          phase.status === 'done'
                            ? 'bg-green-500/15 text-green-500'
                            : phase.status === 'on-track'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-red-500/15 text-red-500'
                        }`}
                      >
                        {phase.status === 'done' ? <CheckCircle2 className='h-3 w-3' /> : <Circle className='h-3 w-3' />}
                        {phase.status}
                      </span>
                    </div>
                    <div className='inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-3'>
                      <Rocket className='h-4 w-4 text-primary' />
                      <span className='text-xs text-muted-foreground'>Expected impact</span>
                      <span className='text-xs font-medium'>{phase.impact}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className='space-y-4'>
            <Card className='glass-subtle'>
              <CardHeader>
                <CardTitle>Support model</CardTitle>
              </CardHeader>
              <CardContent className='p-0 sm:p-6'>
                <div className='divide-y divide-border/60'>
                  {SUPPORT_ROWS.map((row) => (
                    <div key={row.item} className='px-4 py-3'>
                      <p className='text-sm font-medium'>{row.item}</p>
                      <p className='text-xs text-muted-foreground mt-0.5'>{row.need}</p>
                      <p className='text-xs text-primary mt-1'>{row.decision}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className='glass-subtle'>
              <CardHeader>
                <CardTitle>Gating policy</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2 text-sm text-muted-foreground'>
                {[
                  'Keep fallback optional but review weekly.',
                  'Block any expansion milestone if security review is past due.',
                  'Weekly gating review by CEO on Wednesdays.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ChevronRight className='h-3.5 w-3.5 mt-0.5 text-primary' />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RolloutPlanPage;

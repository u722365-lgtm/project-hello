import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Target, Globe2, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type Scenario = {
  title: string;
  yearly: number;
  cohorts: number;
  description: string;
  assumptions: string[];
  quarterData: { quarter: string; value: number }[];
};

const SCENARIOS: Scenario[] = [
  {
    title: 'Conservative',
    yearly: 540000,
    cohorts: 42,
    description: 'Reasonable ARR growth with normal churn and moderate expansion.',
    assumptions: [
      'Monthly churn ~3.2%',
      'Net revenue retention ~108%',
      'Average ACV $4,800',
    ],
    quarterData: [
      { quarter: 'Q1', value: 95000 },
      { quarter: 'Q2', value: 132000 },
      { quarter: 'Q3', value: 151000 },
      { quarter: 'Q4', value: 162000 },
    ],
  },
  {
    title: 'Base',
    yearly: 980000,
    cohorts: 74,
    description: 'Expected outcome based on active pilots and current acceleration.',
    assumptions: [
      'Monthly churn ~2.4%',
      'Net revenue retention ~118%',
      'Average ACV $5,200',
    ],
    quarterData: [
      { quarter: 'Q1', value: 140000 },
      { quarter: 'Q2', value: 202000 },
      { quarter: 'Q3', value: 260000 },
      { quarter: 'Q4', value: 378000 },
    ],
  },
  {
    title: 'Aggressive',
    yearly: 1840000,
    cohorts: 128,
    description: 'Accelerated growth with expansion in APAC and enterprise land-and-expand.',
    assumptions: [
      'Monthly churn ~1.8%',
      'Net revenue retention ~132%',
      'Average ACV $5,700',
    ],
    quarterData: [
      { quarter: 'Q1', value: 210000 },
      { quarter: 'Q2', value: 320000 },
      { quarter: 'Q3', value: 440000 },
      { quarter: 'Q4', value: 870000 },
    ],
  },
];

const RAG_ROWS = [
  { item: 'Revenue', status: 'green', detail: 'Track' },
  { item: 'Retention', status: 'green', detail: 'OK' },
  { item: 'Churn', status: 'amber', detail: 'Edge of target' },
  { item: 'Expansion', status: 'green', detail: 'Ramp' },
  { item: 'Compliance', status: 'green', detail: 'Clear' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const StockScenariosPage = () => {
  const [scenario, setScenario] = useState<string>(SCENARIOS[0].title.toLowerCase());

  const selected = SCENARIOS.find((s) => s.title.toLowerCase() === scenario) ?? SCENARIOS[0];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <main className='container mx-auto px-4 pt-24 pb-16 max-w-6xl'>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8'>
            <div>
              <span className='inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-xs text-muted-foreground border border-border/50 mb-3'>
                <Globe2 className='h-3.5 w-3.5 text-primary' />
                Scenario view
              </span>
              <h1 className='text-4xl font-bold tracking-tight'>
                Stock <span className='gradient-text'>Scenarios</span>
              </h1>
              <p className='text-muted-foreground mt-1'>
                CEO-level forecasting for pilots, retention, and enterprise expansion.
            </p>
            </div>
            <Button variant='outline' className='glass-subtle border-border/40'>
              <Target className='h-4 w-4 mr-2' />
              Scenario inputs
            </Button>
          </div>
        </motion.div>

        <Tabs value={scenario} onValueChange={setScenario} className='space-y-6'>
          <TabsList className='glass-subtle border-border/40'>
            {SCENARIOS.map((s) => (
              <TabsTrigger
                key={s.title.toLowerCase()}
                value={s.title.toLowerCase()}
                className='gap-1.5'
              >
                {s.title === 'Conservative' && <TrendingUp className='h-4 w-4' />}
                {s.title === 'Base' && <Target className='h-4 w-4' />}
                {s.title === 'Aggressive' && <Globe2 className='h-4 w-4' />}
                <span className='hidden sm:inline'>{s.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SCENARIOS.map((s) => (
            <TabsContent key={s.title.toLowerCase()} value={s.title.toLowerCase()} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-2'>
                <Card className='glass-subtle'>
                  <CardContent className='p-5'>
                    <span className='text-xs text-muted-foreground'>Yearly proxy</span>
                    <p className='text-2xl font-bold mt-1'>{formatCurrency(s.yearly)}</p>
                  </CardContent>
                </Card>
                <Card className='glass-subtle'>
                  <CardContent className='p-5'>
                    <span className='text-xs text-muted-foreground'>Enterprise cohorts</span>
                    <p className='text-2xl font-bold mt-1'>{s.cohorts}</p>
                  </CardContent>
                </Card>
                <Card className='glass-subtle md:col-span-2'>
                  <CardContent className='p-5'>
                    <span className='text-xs text-muted-foreground'>Assumptions</span>
                    <div className='mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground'>
                      {s.assumptions.map((a) => (
                        <span className='rounded-full border border-border/60 bg-card/60 px-2.5 py-1' key={a}>{a}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Card className='lg:col-span-2 glass-subtle'>
                  <CardHeader>
                    <CardTitle>Quarterly trajectory</CardTitle>
                  </CardHeader>
                  <CardContent className='h-64 w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart data={s.quarterData}>
                        <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                        <XAxis dataKey='quarter' stroke='hsl(var(--muted-foreground))' tick={{ fontSize: 12 }} />
                        <YAxis stroke='hsl(var(--muted-foreground))' tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000)}k`} />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Value']}
                          contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Line type='monotone' dataKey='value' stroke='hsl(var(--primary))' strokeWidth={2} dot={{ stroke: 'hsl(var(--background))' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className='space-y-4'>
                  <Card className='glass-subtle'>
                    <CardHeader>
                      <CardTitle>Readiness</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {RAG_ROWS.map((r) => (
                          <div key={r.item} className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>{r.item}</span>
                            <span className={`font-medium ${r.status === 'green' ? 'text-green-500' : 'text-amber-500'}`}>
                              {r.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='glass-subtle'>
                    <CardHeader>
                      <CardTitle>Model levers</CardTitle>
                    </CardHeader>
                    <CardContent className='text-sm text-muted-foreground space-y-2'>
                      {[
                        'Churn target: 2.0–2.6% monthly',
                        'Expansion focus: APAC + enterprise',
                        'ACV lever: onboarding premium',
                        'Pricing: growth-first, later stage',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <ArrowRight className='h-3.5 w-3.5 mt-0.5 text-primary' />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default StockScenariosPage;

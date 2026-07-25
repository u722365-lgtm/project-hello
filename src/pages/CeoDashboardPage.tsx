import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  Shield,
  Activity,
  Globe,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type Signal = {
  name: string;
  value: number;
};

const SERIES: Signal[] = [
  { name: 'Mon', value: 41 },
  { name: 'Tue', value: 52 },
  { name: 'Wed', value: 48 },
  { name: 'Thu', value: 63 },
  { name: 'Fri', value: 59 },
  { name: 'Sat', value: 71 },
  { name: 'Sun', value: 68 },
];

const PILOT_KPIS = [
  { label: 'Active pilots', value: '18', delta: '+4', icon: Activity },
  { label: 'Enterprise-ready', value: '6', delta: 'Last 30 days', icon: Shield },
  { label: 'NPS', value: '72', delta: '+8 points', icon: TrendingUp },
  { label: 'ARR proxy', value: '$124k', delta: '+18% Q/Q', icon: Globe },
];

const PILOT_ROWS = [
  { company: 'Northwind', status: 'Active', owner: 'Sarah', impact: '$18k', score: 88 },
  { company: 'Medient Labs', status: 'At risk', owner: 'Ava', impact: '$22k', score: 64 },
  { company: 'BuildPath', status: 'Active', owner: 'Jay', impact: '$9.4k', score: 91 },
  { company: 'Axis Retail', status: 'Pending', owner: 'Mina', impact: '$14.2k', score: 77 },
  { company: 'Orion', status: 'Active', owner: 'Kai', impact: '$31k', score: 93 },
];

const TODAY = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const CeoDashboardPage = () => {
  const [tab, setTab] = useState('overview');

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <main className='container mx-auto px-4 pt-24 pb-16 max-w-6xl'>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-start justify-between gap-4 mb-8'
        >
          <div>
            <span className='inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-xs text-muted-foreground border border-border/50 mb-3'>
              <Shield className='h-3.5 w-3.5 text-primary' />
              Executive view
            </span>
            <h1 className='text-4xl font-bold tracking-tight'>
              CEO <span className='gradient-text'>Dashboard</span>
            </h1>
            <p className='text-muted-foreground mt-1'>
              Live view of pilots, revenue health, and operational risk.
              Updated {TODAY}.
            </p>
          </div>
          <Button variant='outline' className='glass-subtle border-border/40'>
            <ArrowUpRight className='h-4 w-4 mr-2' />
            Board view
          </Button>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10'>
          {PILOT_KPIS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                custom={i * 0.07}
                initial='hidden'
                animate='visible'
                variants={fadeUp}
              >
                <Card className='glass-subtle'>
                  <CardContent className='p-5'>
                    <div className='flex items-center justify-between mb-3'>
                      <span className='text-xs font-medium text-muted-foreground'>
                        {item.label}
                      </span>
                      <span className='rounded-lg bg-primary/10 p-2 text-primary'>
                        <Icon className='h-4 w-4' />
                      </span>
                    </div>
                    <p className='text-3xl font-bold tracking-tight'>{item.value}</p>
                    <p className='text-xs text-muted-foreground mt-1'>{item.delta}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Tabs value={tab} onValueChange={setTab} className='space-y-6'>
          <TabsList className='glass-subtle border-border/40'>
            <TabsTrigger value='overview' className='gap-1.5'>
              <BarChart3 className='h-4 w-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='pilots' className='gap-1.5'>
              <Users className='h-4 w-4' />
              Customers
            </TabsTrigger>
            <TabsTrigger value='risk' className='gap-1.5'>
              <Shield className='h-4 w-4' />
              Risk
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <Card className='glass-subtle'>
              <CardHeader>
                <CardTitle>Weekly adoption signal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={SERIES}>
                      <defs>
                        <linearGradient id='signal' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='0%' stopColor='hsl(var(--primary))' stopOpacity={0.35} />
                          <stop offset='100%' stopColor='hsl(var(--primary))' stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
                      <XAxis dataKey='name' stroke='hsl(var(--muted-foreground))' tick={{ fontSize: 12 }} />
                      <YAxis stroke='hsl(var(--muted-foreground))' tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Area type='monotone' dataKey='value' stroke='hsl(var(--primary))' fill='url(#signal)' />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='pilots'>
            <Card className='glass-subtle'>
              <CardHeader>
                <CardTitle>Enterprise pilot portfolio</CardTitle>
              </CardHeader>
              <CardContent className='p-0 sm:p-6'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-left text-muted-foreground'>
                        <th className='p-3 font-medium'>Company</th>
                        <th className='p-3 font-medium'>Owner</th>
                        <th className='p-3 font-medium'>Impact</th>
                        <th className='p-3 font-medium'>Score</th>
                        <th className='p-3 font-medium'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PILOT_ROWS.map((row) => (
                        <tr key={row.company} className='border-t border-border/50'>
                          <td className='p-3 font-medium'>{row.company}</td>
                          <td className='p-3 text-muted-foreground'>{row.owner}</td>
                          <td className='p-3 text-muted-foreground'>{row.impact}</td>
                          <td className='p-3'>
                            <span className={row.score >= 85 ? 'text-green-500' : row.score >= 70 ? 'text-amber-500' : 'text-red-500'}>
                              {row.score}
                            </span>
                          </td>
                          <td className='p-3'>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.status === 'Active' ? 'bg-green-500/15 text-green-500' :
                              row.status === 'At risk' ? 'bg-red-500/15 text-red-500' :
                              'bg-amber-500/15 text-amber-500'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='risk'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {[
                { title: 'Churn risk', value: 'Low', color: 'text-green-500' },
                { title: 'Compliance exposure', value: 'Medium', color: 'text-amber-500' },
                { title: 'Offline fallback', value: 'Enabled', color: 'text-primary' },
                { title: 'Incident trend', value: '-28%', color: 'text-green-500' },
                { title: 'Security posture', value: 'Strong', color: 'text-primary' },
                { title: 'Data residency', value: 'US/EU', color: 'text-primary' },
              ].map((risk) => (
                <Card key={risk.title} className='glass-subtle'>
                  <CardContent className='p-5'>
                    <p className='text-xs text-muted-foreground'>{risk.title}</p>
                    <p className={`text-xl font-bold mt-1 ${risk.color}`}>{risk.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default CeoDashboardPage;

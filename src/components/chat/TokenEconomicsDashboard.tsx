import React, { useEffect, useState } from 'react';
import { Activity, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { getTelemetryMetrics, type StoredMetric } from '@/lib/telemetry/agenticMetrics';

export const TokenEconomicsDashboard = () => {
  const [metrics, setMetrics] = useState<StoredMetric[]>([]);
  
  useEffect(() => {
    const load = async () => {
      const data = await getTelemetryMetrics();
      setMetrics(data);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalCost = metrics.reduce((acc, m) => acc + (m.estimatedCostUsd || 0), 0);
  const totalTokens = metrics.reduce((acc, m) => acc + (m.inputTokens || 0) + (m.outputTokens || 0), 0);
  const completions = metrics.filter((m) => m.event === 'llm_completion');
  const avgTtft = completions.length 
    ? completions.reduce((acc, m) => acc + (m.ttftMs || 0), 0) / completions.length 
    : 0;
    
  const errors = metrics.filter((m) => m.event === 'agent_loop_failure').length;

  const chartData = completions.slice(-20).map((m, i) => ({
    name: `Req ${i+1}`,
    latency: m.ttftMs || 0,
    cost: m.estimatedCostUsd * 1000, // Show in 1/1000th cents for scale
    tokens: (m.inputTokens || 0) + (m.outputTokens || 0)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Estimated Cost</span>
          </div>
          <div className="text-2xl font-bold">${totalCost.toFixed(6)}</div>
          <p className="text-xs text-muted-foreground mt-1">Saved 100% on WebGPU runs</p>
        </div>
        
        <div className="bg-card border border-border/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Total Tokens</span>
          </div>
          <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Processed locally & remote</p>
        </div>
        
        <div className="bg-card border border-border/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">Avg TTFT</span>
          </div>
          <div className="text-2xl font-bold">{Math.round(avgTtft)}ms</div>
          <p className="text-xs text-muted-foreground mt-1">Time to first token</p>
        </div>

        <div className="bg-card border border-border/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Loop Failures</span>
          </div>
          <div className="text-2xl font-bold">{errors}</div>
          <p className="text-xs text-muted-foreground mt-1">Agent hallucination drops</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/20 p-6 rounded-xl">
          <h3 className="text-sm font-semibold text-muted-foreground mb-6">Latency (TTFT) History</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fontSize: 12}} />
                <YAxis stroke="#666" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                <Line type="monotone" dataKey="latency" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border/20 p-6 rounded-xl">
          <h3 className="text-sm font-semibold text-muted-foreground mb-6">Token Usage per Request</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fontSize: 12}} />
                <YAxis stroke="#666" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} cursor={{fill: '#222'}} />
                <Bar dataKey="tokens" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

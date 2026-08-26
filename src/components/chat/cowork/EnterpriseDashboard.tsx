import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Zap, Server, ShieldCheck } from 'lucide-react';

export function EnterpriseDashboard() {
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    timeSavedMinutes: 0,
    successRate: 100,
    activeAgents: 3
  });

  useEffect(() => {
    // In a real app, we'd fetch this from the agenticMetrics backend or local storage.
    // Simulating fetching enterprise metrics.
    setMetrics({
      totalTokens: 145230,
      timeSavedMinutes: 340,
      successRate: 98.4,
      activeAgents: 3
    });
  }, []);

  return (
    <div className="p-6 h-full bg-background overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Enterprise Telemetry</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dev Time Saved</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.timeSavedMinutes} mins</div>
            <p className="text-xs text-muted-foreground">Estimated based on tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Swarm Success Rate</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">QA Agent verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Swarm Agents</CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">PM, Coder, QA</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
         Detailed charts would render here using Recharts.
      </div>
    </div>
  );
}

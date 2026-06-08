import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Share2,
} from "lucide-react";

interface ScaleConfig {
  id: string;
  enabled: boolean;
  autopilot: boolean;
  ethical_mode: boolean;
}

interface ScaleAction {
  id: string;
  action_type: string;
  payload: Record<string, unknown>;
  confidence: number;
  status: string;
  created_at: string;
  result?: Record<string, unknown>;
}

interface DailyMetrics {
  metric_date: string;
  signups: number;
  referrals: number;
  conversions: number;
  shares: number;
}

export function GrowthCommandPanel() {
  const [config, setConfig] = useState<ScaleConfig | null>(null);
  const [actions, setActions] = useState<ScaleAction[]>([]);
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: cfg } = await supabase.from("shadowscale_config").select("*").limit(1).maybeSingle();
    setConfig((cfg as ScaleConfig | null) ?? null);

    const { data: acts } = await supabase
      .from("shadowscale_action_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setActions((acts ?? []) as ScaleAction[]);

    const { data: m } = await supabase
      .from("shadowscale_metrics_daily")
      .select("*")
      .order("metric_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    setMetrics((m as DailyMetrics | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("growth-command")
      .on("postgres_changes", { event: "*", schema: "public", table: "shadowscale_action_queue" }, load)
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load]);

  const updateConfig = async (patch: Partial<ScaleConfig>) => {
    if (!config?.id) return;
    const { error } = await supabase.from("shadowscale_config").update(patch).eq("id", config.id);
    if (error) toast.error(error.message);
    else {
      setConfig({ ...config, ...patch });
      toast.success("Growth engine updated");
    }
  };

  const approve = async (id: string) => {
    await supabase.from("shadowscale_action_queue").update({ status: "approved" }).eq("id", id);
    toast.success("Approved — worker will execute on next cycle");
    void load();
  };

  const reject = async (id: string) => {
    await supabase.from("shadowscale_action_queue").update({ status: "rejected" }).eq("id", id);
    void load();
  };

  const runOrchestrator = async () => {
    const { data, error } = await supabase.functions.invoke("shadow-scale-orchestrator", {
      body: { source: "admin_manual" },
    });
    if (error) toast.error(error.message);
    else toast.success(`Orchestrator ran: ${JSON.stringify(data?.queued ?? [])}`);
    void load();
  };

  const pending = actions.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Growth Command
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            ShadowScale autonomous engine — hybrid mode: low-risk auto-runs; you approve outbound blasts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => void runOrchestrator()}>
            <Play className="h-4 w-4 mr-1" /> Run cycle
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Signups (rollup)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics?.signups ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Referrals
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics?.referrals ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Conversions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics?.conversions ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending actions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{pending}</CardContent>
        </Card>
      </div>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engine controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch
                checked={config.enabled}
                onCheckedChange={(v) => void updateConfig({ enabled: v })}
              />
              <Label>Engine enabled</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={config.autopilot}
                onCheckedChange={(v) => void updateConfig({ autopilot: v })}
              />
              <Label>Autopilot (high-confidence outbound)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={config.ethical_mode}
                onCheckedChange={(v) => void updateConfig({ ethical_mode: v })}
              />
              <Label>Ethical mode (proof over hype)</Label>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void updateConfig({ enabled: false })}
            >
              <Pause className="h-4 w-4 mr-1" /> Emergency pause
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.length === 0 && (
            <p className="text-sm text-muted-foreground">No actions yet. Run a cycle to generate playbooks.</p>
          )}
          {actions.map((a) => (
            <div key={a.id} className="rounded-lg border border-border/60 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{a.action_type}</Badge>
                <Badge variant="secondary">{Math.round(a.confidence * 100)}%</Badge>
                <Badge>{a.status}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
              <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-x-auto max-h-24">
                {JSON.stringify(a.payload, null, 2)}
              </pre>
              {a.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void approve(a.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void reject(a.id)}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

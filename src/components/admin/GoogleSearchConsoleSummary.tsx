import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Globe, MousePointerClick, Eye, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Row {
  query?: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscSummary {
  site: string;
  sites: string[];
  range: { start: string; end: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: Row[];
  topPages: Row[];
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

export default function GoogleSearchConsoleSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GscSummary | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("gsc-summary");
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setData(data as GscSummary);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Google Search Console
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Read-only summary for the last 28 days from your connected GSC property.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm">
            <p className="font-medium text-destructive mb-1">Couldn't load GSC data</p>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Site:</span>
            <Badge variant="secondary">{data.site}</Badge>
            <span className="ml-2">{data.range.start} → {data.range.end}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Clicks" icon={<MousePointerClick className="h-4 w-4" />} value={data.totals.clicks.toLocaleString()} />
            <StatCard label="Impressions" icon={<Eye className="h-4 w-4" />} value={data.totals.impressions.toLocaleString()} />
            <StatCard label="Avg CTR" icon={<TrendingUp className="h-4 w-4" />} value={fmtPct(data.totals.ctr)} />
            <StatCard label="Avg Position" icon={<TrendingUp className="h-4 w-4" />} value={data.totals.position.toFixed(1)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RowsTable title="Top queries" rows={data.topQueries} labelKey="query" />
            <RowsTable title="Top pages" rows={data.topPages} labelKey="page" />
          </div>
        </>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function RowsTable({ title, rows, labelKey }: { title: string; rows: Row[]; labelKey: "query" | "page" }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => {
              const label = (r as Row & Record<string, string>)[labelKey] || "—";
              const isUrl = labelKey === "page" && label.startsWith("http");
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-sm border-b border-border/50 pb-2 last:border-0">
                  <div className="truncate flex-1" title={label}>
                    {isUrl ? (
                      <a href={label} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                        {label} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : label}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span><strong className="text-foreground">{r.clicks}</strong> clicks</span>
                    <span>{r.impressions.toLocaleString()} impr</span>
                    <span>{fmtPct(r.ctr)}</span>
                    <span>#{r.position.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

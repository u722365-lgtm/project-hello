import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Bot } from "lucide-react";

interface ErrorRow {
  id: string;
  kind: string;
  message: string;
  occurrences: number;
  status: string;
  last_seen_at: string;
  route: string | null;
  source_file: string | null;
}

interface ProposalRow {
  id: string;
  error_id: string;
  diagnosis: string;
  patch_strategy: string;
  confidence: number;
  status: string;
  target_files: string[];
  patch_diff: string | null;
  runtime_handler: Record<string, unknown> | null;
  created_at: string;
}

const SelfHealingPage = () => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [proposals, setProposals] = useState<Record<string, ProposalRow[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: errs } = await supabase
      .from("shadowtalk_errors")
      .select("id, kind, message, occurrences, status, last_seen_at, route, source_file")
      .order("last_seen_at", { ascending: false })
      .limit(100);
    setErrors((errs ?? []) as ErrorRow[]);

    const { data: props } = await supabase
      .from("shadowtalk_fix_proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const map: Record<string, ProposalRow[]> = {};
    for (const p of (props ?? []) as ProposalRow[]) {
      (map[p.error_id] ??= []).push(p);
    }
    setProposals(map);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("self-heal")
      .on("postgres_changes", { event: "*", schema: "public", table: "shadowtalk_errors" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "shadowtalk_fix_proposals" }, load)
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, []);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("shadowtalk_fix_proposals")
      .update({ status: "approved", applied_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Approved", description: "Auto-recovery handler is now active." });
    void load();
  };

  const reject = async (id: string) => {
    await supabase.from("shadowtalk_fix_proposals").update({ status: "rejected" }).eq("id", id);
    void load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Self-Healing Engine</h1>
            <p className="text-sm text-muted-foreground">
              Autonomous error detection, AI diagnosis, and one-click runtime patching
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void load()}>
            <RefreshCw className="h-3 w-3 mr-2" /> Refresh
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && errors.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
              No errors captured. ShadowTalk is healthy.
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {errors.map((err) => {
            const proposalList = proposals[err.id] ?? [];
            return (
              <Card key={err.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <span className="truncate font-mono text-xs">{err.message}</span>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <Badge variant="outline">{err.kind}</Badge>
                        <Badge variant="secondary">×{err.occurrences}</Badge>
                        {err.route && <Badge variant="outline">{err.route}</Badge>}
                        {err.source_file && (
                          <Badge variant="outline" className="font-mono">
                            {err.source_file.split("/").pop()}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(err.last_seen_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant={err.status === "proposed" ? "default" : "secondary"}>
                      {err.status}
                    </Badge>
                  </div>
                </CardHeader>
                {proposalList.length > 0 && (
                  <CardContent className="space-y-3 pt-0">
                    {proposalList.map((p) => (
                      <div key={p.id} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Bot className="h-3 w-3 text-primary" />
                          <span className="font-semibold">{p.patch_strategy}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {Math.round(p.confidence * 100)}% confident
                          </Badge>
                          <Badge variant={p.status === "approved" || p.status === "applied" ? "default" : "secondary"} className="text-[10px]">
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-sm">{p.diagnosis}</p>
                        {p.target_files?.length > 0 && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {p.target_files.join(", ")}
                          </div>
                        )}
                        {p.patch_diff && (
                          <pre className="text-[10px] bg-background/60 rounded p-2 overflow-x-auto max-h-48">
                            {p.patch_diff}
                          </pre>
                        )}
                        {p.runtime_handler && (
                          <pre className="text-[10px] bg-background/60 rounded p-2 overflow-x-auto">
                            {JSON.stringify(p.runtime_handler, null, 2)}
                          </pre>
                        )}
                        {p.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="default" onClick={() => void approve(p.id)}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void reject(p.id)}>
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SelfHealingPage;

import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { backend } from "@/integrations/local/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Monitor, Shield, LogOut, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Navigate } from "react-router-dom";

interface SessionRow {
  id: string;
  device_label: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  city: string | null;
  country: string | null;
  is_current: boolean;
  revoked_at: string | null;
  last_seen_at: string;
  created_at: string;
}

export default function SessionsPage() {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await backend
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false });
    if (error) {
      toast.error("Failed to load sessions");
      return;
    }
    setSessions((data || []) as SessionRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const revoke = async (id: string) => {
    setBusy(true);
    const { error } = await backend
      .from("user_sessions")
      .update({ revoked_at: new Date().toISOString(), is_current: false })
      .eq("id", id);
    setBusy(false);
    if (error) return toast.error("Could not revoke session");
    toast.success("Session revoked — that device will sign out within 60s");
    load();
  };

  const revokeAllOthers = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await backend
      .from("user_sessions")
      .update({ revoked_at: new Date().toISOString(), is_current: false })
      .eq("user_id", user.id)
      .eq("is_current", false)
      .is("revoked_at", null);
    setBusy(false);
    if (error) return toast.error("Could not revoke");
    toast.success("All other devices signed out");
    load();
  };

  const active = sessions.filter((s) => !s.revoked_at);
  const revoked = sessions.filter((s) => s.revoked_at);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Helmet>
        <title>Active Sessions — ShadowTalk Security</title>
        <meta name="description" content="View and revoke active device sessions on your ShadowTalk account for maximum security." />
        <link rel="canonical" href="https://shadowtalk-ai.com/sessions" />
      </Helmet>

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Active sessions</h1>
        </div>
        <p className="text-muted-foreground">
          Every device signed in to your account. Revoke any session you don't recognize.
        </p>
      </header>

      <div className="mb-6 flex justify-end">
        <Button variant="outline" disabled={busy || active.length <= 1} onClick={revokeAllOthers}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out all other devices
        </Button>
      </div>

      <div className="space-y-3">
        {active.map((s) => (
          <Card key={s.id} className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  {s.device_label || "Unknown device"}
                  {s.is_current && <Badge variant="default" className="ml-2">This device</Badge>}
                </span>
                {!s.is_current && (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => revoke(s.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Revoke
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div>Last active {formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true })}</div>
              <div>Signed in {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</div>
              {s.ip_hash && <div className="font-mono">Fingerprint: {s.ip_hash}</div>}
            </CardContent>
          </Card>
        ))}

        {active.length === 0 && (
          <p className="text-muted-foreground text-sm">No active sessions registered yet.</p>
        )}
      </div>

      {revoked.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-10 mb-3">Revoked</h2>
          <div className="space-y-2">
            {revoked.slice(0, 10).map((s) => (
              <div key={s.id} className="text-xs text-muted-foreground border border-border/40 rounded p-3">
                {s.device_label} — revoked {formatDistanceToNow(new Date(s.revoked_at!), { addSuffix: true })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

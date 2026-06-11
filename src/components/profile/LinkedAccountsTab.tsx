import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link2,
  Unlink,
  CheckCircle2,
  Loader2,
  Shield,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { UserIdentity } from "@supabase/supabase-js";
import {
  connectIntegration,
  disconnectIntegration,
  fetchConnectedIntegrations,
  upsertVaultConnection,
  type IntegrationProvider,
} from "@/lib/integrationOAuth";
import {
  getLinkedIdentities,
  hasProvider,
  linkAuthProvider,
  unlinkAuthProvider,
  type AuthProvider,
} from "@/lib/authIdentities";
import { WhatsAppConnect } from "@/components/chat/WhatsAppConnect";

import { SettingsStagger } from "@/components/settings/SettingsStagger";

interface LinkedAccountsTabProps {
  userId: string;
  email: string;
}

type WorkspaceIntegration = {
  id: IntegrationProvider;
  name: string;
  icon: string;
  description: string;
};

const WORKSPACE_INTEGRATIONS: WorkspaceIntegration[] = [
  {
    id: "google",
    name: "Google Workspace",
    icon: "🔷",
    description: "Gmail, Calendar, Drive & Contacts",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    description: "Repos, issues & code automation",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "📱",
    description: "Team notifications & alerts",
  },
  {
    id: "notion",
    name: "Notion",
    icon: "📝",
    description: "Sync pages to your knowledge base",
  },
];

export const LinkedAccountsTab = ({ userId, email }: LinkedAccountsTabProps) => {
  const { toast } = useToast();
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [authAction, setAuthAction] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ids, connected] = await Promise.all([
        getLinkedIdentities(),
        fetchConnectedIntegrations(),
      ]);
      setIdentities(ids);
      setOauthProviders(connected.oauth);
    } catch (e) {
      console.error("Failed to load linked accounts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, userId]);

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const handleLinkSignIn = async (provider: AuthProvider) => {
    setAuthAction(provider);
    const { error } = await linkAuthProvider(provider);
    if (error) {
      toast({ title: "Could not connect", description: error, variant: "destructive" });
    }
    setAuthAction(null);
    await refresh();
  };

  const handleUnlinkSignIn = async (identity: UserIdentity) => {
    if (identities.length <= 1) {
      toast({
        title: "Cannot disconnect",
        description: "Keep at least one sign-in method on your account.",
        variant: "destructive",
      });
      return;
    }
    setAuthAction(identity.provider);
    const { error } = await unlinkAuthProvider(identity);
    if (error) {
      toast({ title: "Could not disconnect", description: error, variant: "destructive" });
    } else {
      toast({ title: "Disconnected", description: `${identity.provider} sign-in removed.` });
    }
    setAuthAction(null);
    await refresh();
  };

  const handleConnectWorkspace = async (provider: IntegrationProvider) => {
    setConnecting(provider);
    const result = await connectIntegration(provider);
    if (result.ok) {
      await upsertVaultConnection(provider);
      toast({ title: "Connected", description: `${provider} is now linked to ShadowTalk.` });
      await refresh();
    } else if (!result.redirecting) {
      toast({
        title: "Connection failed",
        description: result.error,
        variant: "destructive",
      });
    }
    setConnecting(null);
  };

  const handleDisconnectWorkspace = async (provider: IntegrationProvider, name: string) => {
    setConnecting(provider);
    await disconnectIntegration(provider);
    toast({ title: "Disconnected", description: `${name} has been unlinked.` });
    await refresh();
    setConnecting(null);
  };

  const googleSignIn = hasProvider(identities, "google");
  const appleSignIn = hasProvider(identities, "apple");
  const hasEmail = Boolean(email);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SettingsStagger className="space-y-6">
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Sign-In Methods
          </CardTitle>
          <CardDescription>Manage how you sign in to ShadowTalk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-sm font-medium">Email & Password</p>
                <p className="text-xs text-muted-foreground">{email || "—"}</p>
              </div>
            </div>
            {hasEmail ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Active
              </Badge>
            ) : (
              <Badge variant="secondary">Not set</Badge>
            )}
          </div>

          <SignInRow
            name="Google"
            icon="🔷"
            description="Sign in with Google"
            connected={googleSignIn}
            busy={authAction === "google"}
            onConnect={() => handleLinkSignIn("google")}
            onDisconnect={() => {
              const id = identities.find((i) => i.provider === "google");
              if (id) void handleUnlinkSignIn(id);
            }}
          />

          <SignInRow
            name="Apple"
            icon="🍎"
            description="Sign in with Apple ID"
            connected={appleSignIn}
            busy={authAction === "apple"}
            onConnect={() => handleLinkSignIn("apple")}
            onDisconnect={() => {
              const id = identities.find((i) => i.provider === "apple");
              if (id) void handleUnlinkSignIn(id);
            }}
          />
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Integrations
          </CardTitle>
          <CardDescription>
            Connect services for chat tools, notifications, and automation. Opens a secure OAuth window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {WORKSPACE_INTEGRATIONS.map((integration) => {
            const connected = oauthProviders.includes(integration.id);
            const busy = connecting === integration.id;

            return (
              <div
                key={integration.id}
                className="flex items-center justify-between gap-3 p-4 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{integration.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                {connected ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={busy}
                      onClick={() => void handleDisconnectWorkspace(integration.id, integration.name)}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={busy}
                    onClick={() => void handleConnectWorkspace(integration.id)}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Link2 className="h-3 w-3 mr-1" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            );
          })}

          <div className="pt-2">
            <WhatsAppConnect />
          </div>

          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 pt-2 border-t border-border/40">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Google Workspace needs <code className="text-[10px]">GOOGLE_OAUTH_CLIENT_ID</code> on the server.
            GitHub, Slack, and Notion need matching OAuth app credentials — if Connect fails, ask your admin to add them in Supabase secrets.
          </p>
        </CardContent>
      </Card>
    </SettingsStagger>
  );
};

function SignInRow({
  name,
  icon,
  description,
  connected,
  busy,
  onConnect,
  onDisconnect,
}: {
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {connected ? (
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
          </Badge>
          <Button variant="ghost" size="sm" disabled={busy} onClick={onDisconnect}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" disabled={busy} onClick={onConnect}>
          {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
          Connect
        </Button>
      )}
    </div>
  );
}

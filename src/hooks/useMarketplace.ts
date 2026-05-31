import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { InstalledMarketplaceAgent, MarketplaceAgent } from "@/lib/marketplace/types";
import { resolveAgentRuntime, agentRequiresPro } from "@/lib/marketplace/resolveAgentConfig";
import { setActiveMarketplaceAgent } from "@/lib/marketplace/activeAgentSession";
import { openInIde } from "@/lib/idePayloadStorage";

export type { MarketplaceAgent, InstalledMarketplaceAgent };

async function incrementDownload(agentId: string) {
  try {
    await supabase.rpc("increment_marketplace_download", { p_agent_id: agentId });
  } catch {
    /* RPC may be unavailable until migration is applied */
  }
}

async function getAuthUser() {
  try {
    if (typeof supabase.auth?.getUser !== "function") return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

export const useMarketplace = () => {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [installedAgents, setInstalledAgents] = useState<InstalledMarketplaceAgent[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_agents")
      .select("*")
      .eq("is_active", true)
      .order("downloads", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load marketplace agents", variant: "destructive" });
    } else {
      setAgents((data as MarketplaceAgent[]) || []);
    }
    setLoading(false);
  };

  const fetchInstalled = async () => {
    const user = await getAuthUser();
    if (!user) {
      setInstalledIds(new Set());
      setInstalledAgents([]);
      return;
    }

    const { data: links } = await supabase
      .from("user_installed_agents")
      .select("agent_id, installed_at")
      .eq("user_id", user.id);

    if (!links?.length) {
      setInstalledIds(new Set());
      setInstalledAgents([]);
      return;
    }

    const ids = links.map((d) => d.agent_id);
    setInstalledIds(new Set(ids));

    const { data: agentRows } = await supabase
      .from("marketplace_agents")
      .select("*")
      .in("id", ids);

    const byId = new Map((agentRows as MarketplaceAgent[] | null)?.map((a) => [a.id, a]) ?? []);
    const merged: InstalledMarketplaceAgent[] = links
      .map((link) => {
        const agent = byId.get(link.agent_id);
        if (!agent) return null;
        return { ...agent, installed_at: link.installed_at };
      })
      .filter(Boolean) as InstalledMarketplaceAgent[];

    setInstalledAgents(merged);
  };

  const installAgent = async (agentId: string, opts?: { silent?: boolean }) => {
    const user = await getAuthUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to install agents.", variant: "destructive" });
      return false;
    }

    setInstallingId(agentId);
    const { error } = await supabase.from("user_installed_agents").insert({
      user_id: user.id,
      agent_id: agentId,
    });

    if (error) {
      if (error.code === "23505") {
        if (!opts?.silent) {
          toast({ title: "Already installed", description: "This agent is already in your library." });
        }
      } else {
        toast({ title: "Error", description: "Failed to install agent", variant: "destructive" });
        setInstallingId(null);
        return false;
      }
    } else {
      await incrementDownload(agentId);
      if (!opts?.silent) {
        toast({ title: "Installed", description: "Agent added to your library. Click Run to start." });
      }
    }

    await fetchInstalled();
    setInstallingId(null);
    return true;
  };

  const uninstallAgent = async (agentId: string) => {
    const user = await getAuthUser();
    if (!user) return;

    setInstallingId(agentId);
    const { error } = await supabase
      .from("user_installed_agents")
      .delete()
      .eq("user_id", user.id)
      .eq("agent_id", agentId);

    if (!error) {
      toast({ title: "Uninstalled", description: "Agent removed from your library." });
      await fetchInstalled();
    }
    setInstallingId(null);
  };

  const getAgentById = useCallback(
    (id: string) => agents.find((a) => a.id === id) ?? installedAgents.find((a) => a.id === id),
    [agents, installedAgents],
  );

  const runAgent = useCallback(
    async (
      agent: MarketplaceAgent,
      options: {
        isProOrHigher: boolean;
        onNavigate: (path: string) => void;
        openIde?: boolean;
      },
    ) => {
      const user = await getAuthUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Sign in to run marketplace agents.", variant: "destructive" });
        return false;
      }

      if (agentRequiresPro(agent) && !options.isProOrHigher) {
        toast({
          title: "Pro required",
          description: `${agent.name} requires Pro or higher. Upgrade to run this agent.`,
          variant: "destructive",
        });
        options.onNavigate("/pricing");
        return false;
      }

      if (!installedIds.has(agent.id)) {
        const ok = await installAgent(agent.id, { silent: true });
        if (!ok && !installedIds.has(agent.id)) return false;
      }

      const runtime = resolveAgentRuntime(agent);
      if (!runtime) {
        toast({
          title: "Configuration missing",
          description: "This agent has no runtime config yet.",
          variant: "destructive",
        });
        return false;
      }

      setActiveMarketplaceAgent(agent);

      if (options.openIde && runtime.ideScript) {
        openInIde(runtime.ideScript.content, runtime.ideScript.language);
        toast({ title: agent.name, description: "Script opened in Code IDE. Use chat for guided help." });
        return true;
      }

      options.onNavigate(`/chatbot?agent=${encodeURIComponent(agent.id)}`);
      toast({ title: `${agent.name} active`, description: "Chat opened with this agent's instructions." });
      return true;
    },
    [installedIds, installAgent, toast],
  );

  useEffect(() => {
    void fetchAgents();
    void fetchInstalled();
  }, []);

  return {
    agents,
    installedAgents,
    installedIds,
    loading,
    installingId,
    installAgent,
    uninstallAgent,
    runAgent,
    getAgentById,
    fetchAgents,
    fetchInstalled,
  };
};

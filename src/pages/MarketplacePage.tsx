import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Bot, FileText, TrendingUp, Shield, Zap, Code, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { MarketplaceAgentCard } from "@/components/marketplace/MarketplaceAgentCard";
import type { LucideIcon } from "lucide-react";
import type { MarketplaceAgent } from "@/lib/marketplace/types";

const iconMap: Record<string, LucideIcon> = {
  Bot,
  FileText,
  TrendingUp,
  Shield,
  Zap,
  Code,
};

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { isProOrHigher } = useFeatureGating();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    agents,
    installedAgents,
    installedIds,
    loading,
    installingId,
    installAgent,
    uninstallAgent,
    runAgent,
  } = useMarketplace();

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleRun = (agent: MarketplaceAgent, openIde = false) => {
    void runAgent(agent, {
      isProOrHigher,
      onNavigate: navigate,
      openIde,
    });
  };

  const renderGrid = (tab: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {filteredAgents
        .filter((a) => tab === "all" || a.category === tab)
        .map((agent) => (
          <MarketplaceAgentCard
            key={agent.id}
            agent={agent}
            iconMap={iconMap}
            isInstalled={installedIds.has(agent.id)}
            isLoading={installingId === agent.id}
            onInstall={() => void installAgent(agent.id)}
            onUninstall={() => void uninstallAgent(agent.id)}
            onRun={() => handleRun(agent)}
            onOpenScript={
              agent.category === "scripts" ? () => handleRun(agent, true) : undefined
            }
            onTagClick={setSearchQuery}
          />
        ))}
      {filteredAgents.filter((a) => tab === "all" || a.category === tab).length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No agents found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            Marketplace
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Agent & Script <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Install agents, run them in chat with specialized instructions, or open script templates in the Code IDE.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents, scripts, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue={installedAgents.length > 0 ? "installed" : "all"} className="mb-8">
          <TabsList className="mx-auto flex w-fit flex-wrap h-auto gap-1">
            <TabsTrigger value="installed">My library ({installedAgents.length})</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="strategy">Strategy Agents</TabsTrigger>
            <TabsTrigger value="scripts">Smart Scripts</TabsTrigger>
          </TabsList>

          <TabsContent value="installed">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : installedAgents.length === 0 ? (
              <Card className="mt-6">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No agents installed yet. Browse the catalog and click <strong>Run</strong> or{" "}
                  <strong>Install</strong>.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {installedAgents.map((agent) => (
                  <MarketplaceAgentCard
                    key={agent.id}
                    agent={agent}
                    iconMap={iconMap}
                    isInstalled
                    isLoading={installingId === agent.id}
                    onInstall={() => void installAgent(agent.id)}
                    onUninstall={() => void uninstallAgent(agent.id)}
                    onRun={() => handleRun(agent)}
                    onOpenScript={
                      agent.category === "scripts" ? () => handleRun(agent, true) : undefined
                    }
                    onTagClick={setSearchQuery}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="all">{renderGrid("all")}</TabsContent>
              <TabsContent value="strategy">{renderGrid("strategy")}</TabsContent>
              <TabsContent value="scripts">{renderGrid("scripts")}</TabsContent>
            </>
          )}
        </Tabs>

        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Build for the Marketplace</h3>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              Publish agents with system prompts and starter workflows. Contact admin to list your agent in the catalog.
            </p>
            <Button onClick={() => navigate("/developers")}>Developer docs</Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default MarketplacePage;

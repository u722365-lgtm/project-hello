import { useState } from "react";
import { ArrowLeft, Puzzle, Search, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

import { useIntegrations, useToggleIntegration } from "@/hooks/useEnterpriseData";

export default function IntegrationsHubPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: integrations = [], isLoading } = useIntegrations();
  const toggleMutation = useToggleIntegration();

  const toggleConnection = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, connected: !currentStatus });
  };

  const filtered = integrations.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background/50 text-foreground overflow-y-auto pb-12">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Integrations Hub</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Connected Apps</h2>
            <p className="text-muted-foreground">Extend ShadowTalk's capabilities by connecting your tools.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search integrations..." 
              className="pl-9 bg-background/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center text-muted-foreground p-12">Loading integrations...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground p-12">
              No integrations found matching "{search}"
            </div>
          ) : (
            filtered.map((integration, idx) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors ${integration.connected ? 'ring-1 ring-primary/20' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-2xl mb-2">
                        {integration.icon}
                      </div>
                      <Badge variant={integration.connected ? "default" : "secondary"} className={integration.connected ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}>
                        {integration.connected ? "Connected" : "Available"}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{integration.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2 min-h-[40px]">
                      {integration.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wider">
                      {integration.category}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {integration.connected ? "Active" : "Disabled"}
                    </span>
                    <Switch 
                      checked={integration.connected} 
                      onCheckedChange={() => toggleConnection(integration.id, integration.connected)} 
                      disabled={toggleMutation.isPending}
                    />
              </Card>
            </motion.div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No integrations found matching "{search}".
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

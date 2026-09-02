import { useState } from "react";
import { ArrowLeft, Puzzle, Search, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const MOCK_INTEGRATIONS = [
  { id: "google_drive", name: "Google Drive", desc: "Sync documents and spreadsheets for deep research context.", category: "Storage", connected: true, icon: "📁" },
  { id: "slack", name: "Slack", desc: "Interact with ShadowTalk directly from your Slack channels.", category: "Communication", connected: false, icon: "💬" },
  { id: "github", name: "GitHub", desc: "Connect repositories for code analysis and pull request reviews.", category: "Development", connected: true, icon: "🐙" },
  { id: "notion", name: "Notion", desc: "Index your Notion workspaces for semantic search.", category: "Productivity", connected: false, icon: "📝" },
  { id: "salesforce", name: "Salesforce", desc: "Draft emails and summarize CRM records automatically.", category: "CRM", connected: false, icon: "☁️" },
  { id: "jira", name: "Jira", desc: "Create and update tickets based on meeting notes.", category: "Project Management", connected: false, icon: "🎫" },
];

export default function IntegrationsHubPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);

  const toggleConnection = (id: string) => {
    setIntegrations(integrations.map(int => int.id === id ? { ...int, connected: !int.connected } : int));
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
          {filtered.map((integration, idx) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full flex flex-col border-border/50 bg-card/30 hover:bg-card/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-muted/50 p-2 rounded-lg">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs font-normal bg-background/50">{integration.category}</Badge>
                      </div>
                    </div>
                    <Switch 
                      checked={integration.connected} 
                      onCheckedChange={() => toggleConnection(integration.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">{integration.desc}</p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/20">
                  <div className="flex items-center gap-2 text-sm">
                    {integration.connected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Not Connected</span>
                      </>
                    )}
                  </div>
                  {integration.connected && (
                    <Button variant="ghost" size="sm" className="ml-auto text-xs h-8">Configure</Button>
                  )}
                </CardFooter>
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

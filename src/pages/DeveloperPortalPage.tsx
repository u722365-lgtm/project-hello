import { useState } from "react";
import { ArrowLeft, Key, Copy, Check, EyeOff, Plus, Code, Activity, Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const MOCK_KEYS = [
  { id: "key_1", name: "Production API Key", prefix: "sk_live_...", created: "2024-01-15", lastUsed: "Today at 10:24 AM", status: "active" },
  { id: "key_2", name: "Development Env", prefix: "sk_test_...", created: "2024-02-01", lastUsed: "Yesterday", status: "active" },
];

export default function DeveloperPortalPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    toast({ title: "API Key copied", description: "The API key has been copied to your clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background/50 text-foreground overflow-y-auto">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Developer Portal</h1>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="keys" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys to authenticate requests to the ShadowTalk API.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {MOCK_KEYS.map((key) => (
                  <motion.div 
                    key={key.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50 gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20">
                          {key.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block mt-1">
                        {key.prefix}••••••••••••
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Created {key.created} • Last used {key.lastUsed}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(key.id)}>
                        {copiedId === key.id ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copiedId === key.id ? "Copied" : "Copy"}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <span className="sr-only">Revoke</span>
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Test your integration with a simple cURL request.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto border border-zinc-800">
                  <pre className="text-sm text-zinc-300 font-mono">
<code>{`curl https://api.shadowtalk.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $SHADOWTALK_API_KEY" \\
  -d '{
    "model": "shadow-core",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Metrics</CardTitle>
                <CardDescription>Your API usage for the current billing cycle.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50 bg-muted/20">
                <div className="text-center space-y-2">
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Usage charts will appear here once you make your first API request.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>Comprehensive documentation for all endpoints.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50 bg-muted/20">
                 <div className="text-center space-y-4">
                  <Code className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Redirecting to full developer documentation portal...</p>
                  <Button variant="outline" onClick={() => navigate('/docs')}>View Docs</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

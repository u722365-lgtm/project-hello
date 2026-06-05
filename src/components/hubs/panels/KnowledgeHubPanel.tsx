import { useState, useEffect } from "react";
import VisualKnowledgeGraph from "@/components/chat/VisualKnowledgeGraph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Database, BookOpen, Sparkles, FileText } from "lucide-react";
import {
  searchKnowledgeBase,
  getKBStats,
  seedDefaultKnowledge,
  type KBSearchResult,
} from "@/lib/local-knowledge-base";

export function KnowledgeHubPanel() {
  const [kbQuery, setKbQuery] = useState("");
  const [kbResults, setKbResults] = useState<KBSearchResult[]>([]);
  const [kbStats, setKbStats] = useState<{
    totalArticles: number;
    totalWords: number;
    categories: { name: string; count: number }[];
  } | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    void getKBStats().then(setKbStats);
  }, []);

  const handleKBSearch = async () => {
    if (!kbQuery.trim()) return;
    setSearching(true);
    const results = await searchKnowledgeBase(kbQuery);
    setKbResults(results);
    setSearching(false);
  };

  const handleSeedKB = async () => {
    await seedDefaultKnowledge();
    const stats = await getKBStats();
    setKbStats(stats);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <Tabs defaultValue="graph" className="h-full">
        <TabsList className="mb-4">
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
        </TabsList>
        <TabsContent value="graph" className="h-[calc(100vh-14rem)] mt-0">
          <VisualKnowledgeGraph />
        </TabsContent>
        <TabsContent value="kb" className="mt-0 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search local knowledge base..."
              value={kbQuery}
              onChange={(e) => setKbQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleKBSearch()}
            />
            <Button onClick={() => void handleKBSearch()} disabled={searching}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {kbStats && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline"><Database className="h-3 w-3 mr-1" />{kbStats.totalArticles} articles</Badge>
              <Badge variant="outline"><BookOpen className="h-3 w-3 mr-1" />{kbStats.totalWords.toLocaleString()} words</Badge>
              <Button variant="outline" size="sm" onClick={() => void handleSeedKB()}>
                <Sparkles className="h-3 w-3 mr-1" />Seed defaults
              </Button>
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-18rem)]">
            <div className="space-y-3 pr-4">
              {kbResults.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {r.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground pb-3">
                    {r.snippet}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

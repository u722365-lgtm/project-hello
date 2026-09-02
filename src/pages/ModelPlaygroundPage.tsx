import { useState } from "react";
import { ArrowLeft, Sparkles, Settings2, Play, Save, History, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function ModelPlaygroundPage() {
  const navigate = useNavigate();
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(1);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful, brilliant AI assistant.");
  const [userMessage, setUserMessage] = useState("");
  const [output, setOutput] = useState("");

  const handleRun = () => {
    setOutput("Generating response based on parameters...\n\n(This is a playground mock interface. Connect to backend to execute actual generation.)");
  };

  return (
    <div className="h-screen flex flex-col bg-background/50 text-foreground overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-semibold">Model Studio</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <History className="h-4 w-4 mr-2" />
              Presets
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button size="sm" className="h-8" onClick={handleRun}>
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Parameters */}
        <div className="w-80 shrink-0 border-r border-border/30 bg-card/10 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select defaultValue="shadow-core">
              <SelectTrigger className="bg-background/50 border-border/50">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shadow-core">Shadow-Core (Default)</SelectItem>
                <SelectItem value="shadow-pro">Shadow-Pro</SelectItem>
                <SelectItem value="llama-3">Llama 3 70B (Local)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Temperature</Label>
                <span className="text-xs text-muted-foreground font-mono">{temperature}</span>
              </div>
              <Slider 
                value={[temperature]} 
                onValueChange={(v) => setTemperature(v[0])} 
                max={2} 
                step={0.1} 
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Maximum Length</Label>
                <span className="text-xs text-muted-foreground font-mono">{maxTokens}</span>
              </div>
              <Slider 
                value={[maxTokens]} 
                onValueChange={(v) => setMaxTokens(v[0])} 
                max={8192} 
                step={256} 
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Top P</Label>
                <span className="text-xs text-muted-foreground font-mono">{topP}</span>
              </div>
              <Slider 
                value={[topP]} 
                onValueChange={(v) => setTopP(v[0])} 
                max={1} 
                step={0.05} 
                className="py-2"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Stop Sequences</Label>
            <Input placeholder="e.g. \n\nUser:" className="bg-background/50 border-border/50 text-sm" />
          </div>
        </div>

        {/* Main Content: Prompts & Output */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">SYSTEM</Label>
              <Textarea 
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[100px] resize-y bg-background/50 border-border/50 font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">USER</Label>
              <Textarea 
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-[150px] resize-y bg-background/50 border-border/50 font-mono text-sm leading-relaxed"
              />
            </div>

            {output && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-primary font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    ASSISTANT
                  </Label>
                  <Badge variant="outline" className="text-[10px] font-mono">1.2s • 42 tokens</Badge>
                </div>
                <div className="p-4 rounded-md bg-muted/20 border border-border/30 whitespace-pre-wrap font-mono text-sm text-zinc-300">
                  {output}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}

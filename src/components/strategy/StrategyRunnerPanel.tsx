import { useState } from "react";
import { useStrategyRunner } from "@/hooks/useStrategyRunner";
import { StrategyResultView } from "./StrategyResultView";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, Target, MapPin, Building2, BrainCircuit, RefreshCw } from "lucide-react";
import type { BusinessIdea } from "@/lib/strategy/types";

export function StrategyRunnerPanel() {
  const { user } = useAuth();
  const { phase, progress, steps, result, error, isRunning, run, reset } = useStrategyRunner();

  const [idea, setIdea] = useState<BusinessIdea>({
    name: "",
    industry: "",
    location: "",
    description: "",
  });

  const handleRun = () => {
    if (!user) return;
    void run(idea, user.id);
  };

  const isFormValid = idea.name && idea.industry && idea.location && idea.description;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Input Form */}
        <Card className="flex-1 border-primary/20 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" /> Strategy AI
            </CardTitle>
            <CardDescription>
              Input your business parameters. The autonomous Strategy Agent will map competitors, estimate costs, and synthesize an execution plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" /> Business / Project Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. ShadowTalk"
                value={idea.name}
                onChange={(e) => setIdea({ ...idea, name: e.target.value })}
                disabled={isRunning}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" /> Industry
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g. SaaS / AI"
                  value={idea.industry}
                  onChange={(e) => setIdea({ ...idea, industry: e.target.value })}
                  disabled={isRunning}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Target Market Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Global, US, Local"
                  value={idea.location}
                  onChange={(e) => setIdea({ ...idea, location: e.target.value })}
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Core Description & Goals</Label>
              <Textarea
                id="desc"
                placeholder="Describe your vision, primary value proposition, and what you aim to achieve..."
                className="min-h-[100px]"
                value={idea.description}
                onChange={(e) => setIdea({ ...idea, description: e.target.value })}
                disabled={isRunning}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                onClick={handleRun} 
                disabled={!isFormValid || isRunning}
                className="flex-1 bg-primary/90 hover:bg-primary"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4 mr-2" /> Generate Strategy
                  </>
                )}
              </Button>
              {result && (
                <Button variant="outline" onClick={reset} disabled={isRunning}>
                  Reset
                </Button>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive mt-2">Error: {error}</p>
            )}
          </CardContent>
        </Card>

        {/* Execution Tracker */}
        {(isRunning || result || phase === 'error') && (
          <Card className="flex-1 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Agent Execution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">Phase: {phase}</span>
                  <span className="font-mono text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`
                      h-2 w-2 rounded-full shrink-0
                      ${step.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        step.status === 'running' ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 
                        'bg-muted'}
                    `} />
                    <span className={step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}>
                      {step.action}
                    </span>
                    <span className="ml-auto text-[10px] uppercase font-mono tracking-wider text-muted-foreground/60 border border-border/50 px-1.5 py-0.5 rounded">
                      {step.tool_name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {result && <StrategyResultView result={result} />}
    </div>
  );
}

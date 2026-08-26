import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDreamState } from "@/hooks/useDreamState";
import { Play, Square, Loader2, Sparkles, Terminal, CheckCircle2, AlertCircle, CloudLightning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DreamStateUIProps {
  onCodeGenerated: (code: string) => void;
}

export const DreamStateUI: React.FC<DreamStateUIProps> = ({ onCodeGenerated }) => {
  const { phase, logs, iteration, progress, runSimulation, abort } = useDreamState();
  const [prompt, setPrompt] = useState("");

  const handleStart = () => {
    if (!prompt.trim()) return;
    runSimulation(prompt, (code) => {
      onCodeGenerated(code);
    });
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case "idle": return <CloudLightning className="h-10 w-10 text-fuchsia-500 opacity-50" />;
      case "initializing": return <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />;
      case "coding": return <Terminal className="h-10 w-10 text-blue-500 animate-pulse" />;
      case "simulating": return <Sparkles className="h-10 w-10 text-cyan-500 animate-pulse" />;
      case "debugging": return <AlertCircle className="h-10 w-10 text-red-500 animate-bounce" />;
      case "success": return <CheckCircle2 className="h-10 w-10 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/95 text-green-400 font-mono rounded-lg border border-fuchsia-500/30 overflow-hidden relative">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

      {/* Header */}
      <div className="p-4 border-b border-fuchsia-500/20 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-fuchsia-500" />
          <h2 className="text-sm font-bold text-fuchsia-400 tracking-wider">SHADOW DREAMSTATE <span className="text-xs text-muted-foreground ml-2">v1.0.0</span></h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded">
          <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", phase !== "idle" ? "bg-cyan-400" : "bg-muted")} />
            <span className={cn("relative inline-flex rounded-full h-2 w-2", phase !== "idle" ? "bg-cyan-500" : "bg-muted")} />
          </span>
          {phase.toUpperCase()}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 relative z-10">
        
        {/* Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="p-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_50px_-12px_rgba(217,70,239,0.5)]">
                {getPhaseIcon()}
              </div>
              <div className="mt-6 text-center">
                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  {phase === "idle" && "Ready to simulate."}
                  {phase === "initializing" && "Initializing Neural Sandbox..."}
                  {phase === "coding" && "Writing Initial Draft..."}
                  {phase === "simulating" && `Running Simulation (Iteration ${iteration})...`}
                  {phase === "debugging" && "Metacognitive Debugging..."}
                  {phase === "success" && "Zero-Shot Perfection Achieved."}
                </p>
                {phase !== "idle" && phase !== "success" && (
                  <div className="w-64 mt-4 mx-auto">
                    <Progress value={progress} className="h-1 bg-white/10" />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Terminal Logs */}
        <div className="h-48 mt-6 bg-black/60 rounded border border-white/10 p-3 overflow-hidden flex flex-col relative group">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 border-b border-white/10 pb-1 flex justify-between">
            <span>Simulation Matrix Output</span>
            <span>Iter: {iteration}</span>
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-1.5 font-mono text-xs">
              {logs.map((log) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id}
                  className={cn(
                    "flex items-start gap-2",
                    log.type === "error" && "text-red-400",
                    log.type === "success" && "text-green-400",
                    log.type === "info" && "text-cyan-400",
                    log.type === "system" && "text-fuchsia-400"
                  )}
                >
                  <span className="opacity-50 shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                  <span className="break-all">{log.message}</span>
                </motion.div>
              ))}
              {phase !== "idle" && phase !== "success" && (
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-4 bg-fuchsia-500 inline-block align-middle ml-1"
                />
              )}
            </div>
          </ScrollArea>
        </div>

      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-fuchsia-500/20 bg-black/80 z-10">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
            </div>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the feature... (e.g. 'Build a React hook for infinite scrolling')"
              className="w-full bg-white/5 border-white/10 text-white pl-10 focus-visible:ring-fuchsia-500 font-sans"
              disabled={phase !== "idle" && phase !== "success"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && phase === "idle") handleStart();
              }}
            />
          </div>
          
          {phase === "idle" || phase === "success" ? (
            <Button 
              onClick={handleStart}
              disabled={!prompt.trim()}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white min-w-[120px] font-sans"
            >
              <Play className="h-4 w-4 mr-2" /> Simulate
            </Button>
          ) : (
            <Button 
              onClick={abort}
              variant="destructive"
              className="min-w-[120px] font-sans"
            >
              <Square className="h-4 w-4 mr-2 fill-current" /> Abort
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

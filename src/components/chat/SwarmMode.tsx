import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { turboComplete } from "@/lib/turbo";
import { X, Bot, ShieldAlert, Cpu, Briefcase, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Persona {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  systemPrompt: string;
}

const PERSONAS: Persona[] = [
  {
    id: "hacker",
    name: "The Hacker",
    icon: <Cpu className="w-5 h-5" />,
    color: "from-green-500 to-emerald-700",
    systemPrompt: "You are The Hacker. You focus on code, security, performance, and raw technical implementation. Keep your response under 80 words. Be edgy and technical. No pleasantries.",
  },
  {
    id: "designer",
    name: "The Designer",
    icon: <Bot className="w-5 h-5" />,
    color: "from-pink-500 to-rose-700",
    systemPrompt: "You are The Designer. You focus on user experience, beauty, empathy, and aesthetics. Keep your response under 80 words. Be creative, empathetic, and visionary. No pleasantries.",
  },
  {
    id: "critic",
    name: "The Critic",
    icon: <ShieldAlert className="w-5 h-5" />,
    color: "from-red-500 to-orange-700",
    systemPrompt: "You are The Critic. You play devil's advocate, finding flaws, edge cases, and reasons why the idea might fail. Keep your response under 80 words. Be skeptical and sharp. No pleasantries.",
  },
  {
    id: "ceo",
    name: "The CEO",
    icon: <Briefcase className="w-5 h-5" />,
    color: "from-blue-500 to-indigo-700",
    systemPrompt: "You are The CEO. You synthesize the views of the Hacker, Designer, and Critic to make a final strategic business decision. Keep your response under 100 words. Be visionary and decisive. No pleasantries.",
  }
];

export const SwarmMode = ({ 
  prompt, 
  onClose,
  onComplete
}: { 
  prompt: string; 
  onClose: () => void;
  onComplete: (finalAnswer: string) => void;
}) => {
  const [streams, setStreams] = useState<Record<string, string>>({});
  const [isDone, setIsDone] = useState(false);
  const [ceoStarted, setCeoStarted] = useState(false);
  const [finalCEOContent, setFinalCEOContent] = useState("");
  
  useEffect(() => {
    if (!prompt) return;
    
    let isMounted = true;
    const abortControllers = PERSONAS.map(() => new AbortController());
    
    const runSwarm = async () => {
      // Step 1: Run Hacker, Designer, Critic concurrently
      const initialPersonas = PERSONAS.slice(0, 3);
      const results = await Promise.all(
        initialPersonas.map((persona, idx) => 
          turboComplete(persona.systemPrompt, prompt, {
            signal: abortControllers[idx].signal,
            onDelta: (content) => {
              if (isMounted) {
                setStreams(prev => ({ ...prev, [persona.id]: content }));
              }
            }
          }).catch((err) => {
             console.error(err);
             return { content: "Error communicating.", source: 'fallback', totalMs: 0 };
          })
        )
      );
      
      if (!isMounted) return;
      
      setCeoStarted(true);
      
      // Step 2: Run CEO based on the others
      const ceo = PERSONAS[3];
      const context = `
Topic: ${prompt}

The team has debated this.
Hacker's take: ${results[0]?.content || 'Nothing'}
Designer's take: ${results[1]?.content || 'Nothing'}
Critic's take: ${results[2]?.content || 'Nothing'}

Now, synthesize this and provide the final executive decision and plan of action.
      `;
      
      const ceoResult = await turboComplete(ceo.systemPrompt, context, {
        signal: abortControllers[3].signal,
        onDelta: (content) => {
          if (isMounted) {
            setStreams(prev => ({ ...prev, [ceo.id]: content }));
          }
        }
      }).catch(err => {
          console.error(err);
          return { content: "Error communicating.", source: 'fallback', totalMs: 0 };
      });
      
      if (isMounted) {
        setFinalCEOContent(ceoResult?.content || "");
        setIsDone(true);
      }
    };
    
    runSwarm();
    
    return () => {
      isMounted = false;
      abortControllers.forEach(c => c.abort());
    };
  }, [prompt]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 10 }}
      className="absolute inset-2 sm:inset-4 md:inset-6 z-50 flex flex-col bg-background/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-orange-400">
            Swarm Mode
          </h2>
          <span className="text-xs text-muted-foreground ml-2">Neural Consensus Protocol Active</span>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-muted-foreground mb-1">Target Objective:</p>
          <p className="font-medium text-foreground">{prompt}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAS.map((persona, index) => {
            const isCeo = persona.id === "ceo";
            if (isCeo && !ceoStarted) return null;
            
            const content = streams[persona.id] || "...";
            const isGenerating = !isDone && (isCeo ? true : !ceoStarted);
            
            return (
              <motion.div 
                key={persona.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col p-4 rounded-xl border border-white/10 bg-black/40 overflow-hidden ${isCeo ? 'md:col-span-2 ring-1 ring-blue-500/30' : ''}`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${persona.color} opacity-50`} />
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${persona.color} text-white`}>
                    {persona.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{persona.name}</h3>
                  {isGenerating ? (
                    <div className="ml-auto flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-75" />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-150" />
                    </div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                  )}
                </div>
                <div className="flex-1 text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {content}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
        <Button 
          disabled={!isDone}
          onClick={() => onComplete(finalCEOContent)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
        >
          {isDone ? "Accept Consensus" : "Synthesizing..."}
        </Button>
      </div>
    </motion.div>
  );
};

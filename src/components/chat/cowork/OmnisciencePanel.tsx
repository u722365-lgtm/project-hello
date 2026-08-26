import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldAlert, Zap, TestTube, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { OmnisciencePrediction } from '../../../hooks/useOmniscience';
import { Button } from '../../ui/button';

interface OmnisciencePanelProps {
  predictions: OmnisciencePrediction[];
  isAnalyzing: boolean;
  onApplyCode?: (code: string) => void;
}

export function OmnisciencePanel({ predictions, isAnalyzing, onApplyCode }: OmnisciencePanelProps) {
  const getIcon = (type: OmnisciencePrediction['type']) => {
    switch (type) {
      case 'completion': return <Sparkles className="h-4 w-4 text-cyan-400" />;
      case 'security': return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      case 'optimization': return <Zap className="h-4 w-4 text-amber-400" />;
      case 'test': return <TestTube className="h-4 w-4 text-emerald-400" />;
    }
  };

  const getBadgeColor = (type: OmnisciencePrediction['type']) => {
    switch (type) {
      case 'completion': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'security': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'optimization': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'test': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm border-l border-border/50 w-80 shadow-2xl">
      <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            {isAnalyzing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-indigo-400/30 rounded-full border-t-indigo-400"
              />
            )}
          </div>
          <h3 className="font-semibold text-sm bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Shadow Omniscience
          </h3>
        </div>
        {isAnalyzing && (
          <span className="text-[10px] text-muted-foreground animate-pulse">Analyzing...</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence mode="popLayout">
          {predictions.length === 0 && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center"
            >
              <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 opacity-30" />
              </div>
              <p className="text-sm">Monitoring your context...</p>
              <p className="text-xs opacity-70 mt-1 px-4">Start typing to see precognitive suggestions.</p>
            </motion.div>
          )}

          {predictions.map((pred, i) => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-muted/30 border border-border/50 rounded-xl overflow-hidden hover:bg-muted/50 transition-colors"
            >
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(pred.type)}
                    <span className="font-medium text-sm text-foreground/90">{pred.title}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getBadgeColor(pred.type)}`}>
                    {Math.round(pred.confidence * 100)}% Match
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {pred.description}
                </p>

                {pred.codeSnippet && (
                  <div className="mt-2 relative">
                    <pre className="text-[10px] bg-background/80 p-2 rounded-md overflow-x-auto border border-border/50 font-mono text-muted-foreground">
                      {pred.codeSnippet}
                    </pre>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-6 text-[10px] gap-1 px-2 shadow-lg"
                        onClick={() => onApplyCode?.(pred.codeSnippet!)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Marketplace Tab Support */}
      <div className="p-2 border-t border-border/50 bg-background flex gap-2">
         <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => {}}>
            Marketplace Plugins
         </Button>
      </div>
    </div>
  );
}

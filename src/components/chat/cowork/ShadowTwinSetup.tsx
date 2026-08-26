import { motion } from 'framer-motion';
import { BrainCircuit, Database, Cpu, CheckCircle2, Loader2, Play } from 'lucide-react';
import { Button } from '../../ui/button';
import { TwinState } from '../../../hooks/useShadowTwin';
import { Progress } from '../../ui/progress';

interface ShadowTwinSetupProps {
  twinState: TwinState;
  progress: number;
  onTrain: () => void;
  styleVector: string | null;
}

export function ShadowTwinSetup({ twinState, progress, onTrain, styleVector }: ShadowTwinSetupProps) {
  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full p-8 flex flex-col gap-8">
        
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
            <BrainCircuit className="w-12 h-12 text-emerald-400 relative z-10" />
            {twinState !== 'idle' && twinState !== 'ready' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full"
              />
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Shadow Twin
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Train a localized cognitive clone. Shadow Twin ingests your codebase and chat history to mirror your precise coding style and architecture preferences.
          </p>
        </div>

        <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Database className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Twin Cortex Status
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {twinState === 'idle' && "Ready to ingest workspace context."}
                  {twinState === 'ingesting' && "Scraping files and commit history..."}
                  {twinState === 'training' && "Fine-tuning local style vector..."}
                  {twinState === 'ready' && "Cognitive clone fully trained and operational."}
                </p>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {Math.round(progress)}%
              </div>
            </div>

            <Progress value={progress} className="h-2 bg-muted-foreground/20" />

            {twinState === 'idle' && (
              <Button onClick={onTrain} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                <Play className="w-4 h-4" />
                Initialize Training Sequence
              </Button>
            )}

            {(twinState === 'ingesting' || twinState === 'training') && (
              <Button disabled className="w-full bg-emerald-500/50 text-white gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Vector Embeddings...
              </Button>
            )}

            {twinState === 'ready' && styleVector && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/80 border border-emerald-500/20 p-4 rounded-xl space-y-2"
              >
                <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Style Vector Acquired
                </h5>
                <p className="text-sm font-mono text-muted-foreground">
                  {styleVector}
                </p>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Cpu, HardDriveDownload, PowerOff, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getLocalEngine, unloadLocalEngine, isEngineLoaded, isWebGPUSupported, WEBGPU_MODEL } from '@/lib/webgpu/localEngine';
import type { InitProgressReport } from "@mlc-ai/web-llm";

export const SovereignWebGPUDashboard = () => {
  const [loaded, setLoaded] = useState(isEngineLoaded());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  const supported = isWebGPUSupported();

  const handleLoad = async () => {
    try {
      setLoading(true);
      setError('');
      await getLocalEngine((report: InitProgressReport) => {
        setProgress(Math.round(report.progress * 100));
        setStatusText(report.text);
      });
      setLoaded(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load WebGPU engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnload = async () => {
    await unloadLocalEngine();
    setLoaded(false);
    setProgress(0);
    setStatusText('');
  };

  if (!supported) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4 text-red-400">
        <AlertCircle className="w-6 h-6 shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-lg">WebGPU Not Supported</h3>
          <p className="text-sm mt-1">Your current browser or hardware does not support WebGPU. Sovereign AI models cannot run natively on this device.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/20 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border/10 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Sovereign WebGPU Engine</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Run 100% private, zero-cost LLM inference directly in your browser.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground font-mono">
                Model: {WEBGPU_MODEL}
              </span>
              <span className={`text-xs px-2 py-1 rounded font-medium ${loaded ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {loaded ? 'Active (VRAM Allocated)' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {loaded ? (
            <Button variant="destructive" size="sm" onClick={handleUnload}>
              <PowerOff className="w-4 h-4 mr-2" /> Unload Memory
            </Button>
          ) : (
            <Button onClick={handleLoad} disabled={loading}>
              {loading ? (
                <><Zap className="w-4 h-4 mr-2 animate-pulse" /> Loading Engine...</>
              ) : (
                <><HardDriveDownload className="w-4 h-4 mr-2" /> Download & Initialize</>
              )}
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-6 bg-muted/5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-mono truncate mr-4">{statusText}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-3">
            Note: The initial download can be up to 4GB. Weights are securely cached in your browser for future use.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 text-red-400 text-sm border-t border-red-500/20">
          {error}
        </div>
      )}
    </div>
  );
};

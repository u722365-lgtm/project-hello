/**
 * useWebLLM — React hook for managing in-browser LLM state.
 *
 * Provides:
 *   - Model loading with progress
 *   - Chat completions
 *   - Model switching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isWebGPUSupported,
  getLoadedModelId,
  loadWebLlmModel,
  webLlmChat,
  unloadWebLlmModel,
  WEBLLM_MODELS,
  type WebLlmProgress,
  type WebLlmModel,
} from '@/lib/webllm/engine';

export interface UseWebLLMReturn {
  /** Whether WebGPU is available */
  supported: boolean;
  /** Current model loading state */
  state: 'idle' | 'loading' | 'ready' | 'error';
  /** Progress info during loading */
  progress: WebLlmProgress | null;
  /** Currently loaded model */
  loadedModel: WebLlmModel | null;
  /** Available models */
  models: WebLlmModel[];
  /** Load a model */
  loadModel: (modelId: string) => Promise<void>;
  /** Unload current model */
  unloadModel: () => Promise<void>;
  /** Send a chat message */
  chat: (messages: { role: string; content: string }[], opts?: {
    maxTokens?: number;
    onDelta?: (token: string, accumulated: string) => void;
    signal?: AbortSignal;
  }) => Promise<string>;
  /** Error message if state is 'error' */
  error: string | null;
}

export function useWebLLM(): UseWebLLMReturn {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState<WebLlmProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const supported = isWebGPUSupported();
  const currentModelId = getLoadedModelId();
  const loadedModel = WEBLLM_MODELS.find(m => m.id === currentModelId) || null;

  // Sync state with loaded model
  useEffect(() => {
    if (currentModelId && state === 'idle') {
      setState('ready');
    }
  }, [currentModelId]);

  const loadModel = useCallback(async (modelId: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setState('loading');
    setError(null);

    try {
      await loadWebLlmModel(modelId, (p) => {
        setProgress(p);
        if (p.phase === 'ready') setState('ready');
        if (p.phase === 'error') {
          setState('error');
          setError(p.text);
        }
      }, controller.signal);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      abortRef.current = null;
    }
  }, []);

  const unloadModel = useCallback(async () => {
    abortRef.current?.abort();
    await unloadWebLlmModel();
    setState('idle');
    setProgress(null);
    setError(null);
  }, []);

  const chat = useCallback(async (
    messages: { role: string; content: string }[],
    opts?: { maxTokens?: number; onDelta?: (token: string, accumulated: string) => void; signal?: AbortSignal },
  ): Promise<string> => {
    const result = await webLlmChat(messages, {
      maxTokens: opts?.maxTokens,
      signal: opts?.signal,
      onDelta: opts?.onDelta,
    });
    return result.content;
  }, []);

  return {
    supported,
    state,
    progress,
    loadedModel,
    models: WEBLLM_MODELS,
    loadModel,
    unloadModel,
    chat,
    error,
  };
}

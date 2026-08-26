import { useState } from 'react';
import { Project, FileNode } from './useWorkspaces';
import { backend } from "@/integrations/local/client";

export type TwinState = 'idle' | 'ingesting' | 'training' | 'ready';

export function useShadowTwin(activeProject?: Project) {
  const [twinState, setTwinState] = useState<TwinState>('idle');
  const [progress, setProgress] = useState(0);
  const [isTwinModeActive, setIsTwinModeActive] = useState(false);
  const [styleVector, setStyleVector] = useState<string | null>(null);

  const extractAllFilesContext = (nodes: FileNode[]): string => {
    let context = "";
    for (const node of nodes) {
      if (node.type === "file" && node.content) {
        context += `\n--- File: ${node.path} ---\n${node.content}\n`;
      }
      if (node.children) {
        context += extractAllFilesContext(node.children);
      }
    }
    return context;
  };

  // Run Twin training via actual AI backend
  const trainTwin = async () => {
    if (!activeProject) return;
    
    setTwinState('ingesting');
    setProgress(15);

    try {
      // 1. Gather all file content from the workspace
      const fullContext = extractAllFilesContext(activeProject.files);
      setProgress(40);
      
      setTwinState('training');

      // 2. Call the AI backend to generate a style vector
      const messages = [
        { 
          role: "system", 
          content: "You are the core intelligence of ShadowTalk Twin. Your task is to analyze the user's provided codebase and generate a concise 'Style Vector' string. This string must describe their architectural patterns, naming conventions, formatting preferences, and preferred libraries. Do not output anything else but this vector string."
        },
        { role: "user", content: `Codebase Context:\n\n${fullContext}` }
      ];

      setProgress(60);

      const response = await backend.functions.invoke("chat", { body: { messages } });
      
      let vector = response.data?.choices?.[0]?.message?.content || 
                   response.data?.generatedText || 
                   "";

      if (!vector) throw new Error("Failed to generate style vector.");

      setProgress(100);
      setTwinState('ready');
      setStyleVector(vector.trim());

    } catch (error) {
      console.error("[Shadow Twin] Training failed:", error);
      setTwinState('idle');
      setProgress(0);
    }
  };

  const toggleTwinMode = () => {
    if (twinState !== 'ready') return;
    setIsTwinModeActive(prev => !prev);
  };

  // When Twin Mode is active, we append this strict directive to AI chat endpoints
  const getTwinContext = () => {
    if (!isTwinModeActive || !styleVector) return "";
    return `[TWIN MODE ACTIVE]: You are a digital clone of the user. Adopt their coding style perfectly. Your Style Vector is: ${styleVector}`;
  };

  return {
    twinState,
    progress,
    isTwinModeActive,
    trainTwin,
    toggleTwinMode,
    getTwinContext,
    styleVector
  };
}

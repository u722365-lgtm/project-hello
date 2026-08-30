import { useState, useCallback } from 'react';
import { backend } from '@/integrations/local/client';
import { useToast } from '@/hooks/use-toast';

export interface VaultDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // The text content
  chunks: string[];
  embeddings?: number[][];
  addedAt: Date;
  storagePath?: string;
  user_id?: string;
}

interface KnowledgeVaultState {
  documents: VaultDocument[];
  isProcessing: boolean;
  progress: number;
  stage: string;
  totalChunks: number;
  error: string | null;
}

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

const chunkText = (text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] => {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks.length > 0 ? chunks : [text.slice(0, size)];
};

const searchChunks = (query: string, chunks: string[]): string[] => {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const scored = chunks.map(chunk => {
    const lowerChunk = chunk.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (lowerChunk.includes(word)) score += 1;
      if (lowerChunk.includes(query.toLowerCase())) score += 5;
    }
    return { chunk, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.chunk);
};

export const useKnowledgeVault = () => {
  const [state, setState] = useState<KnowledgeVaultState>({
    documents: [],
    isProcessing: false,
    progress: 0,
    stage: '',
    totalChunks: 0,
    error: null,
  });

  const { toast } = useToast();

  const initialize = useCallback(async () => {
    try {
      const { data: { user } } = await backend.auth.getUser();
      if (!user) return;

      const { data: docs, error } = await backend
        .from('vault_documents')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('[KnowledgeVault] Init error:', error);
        return;
      }

      if (docs) {
        const parsedDocs = docs.map((d: any) => ({
          ...d,
          addedAt: new Date(d.addedAt || d.created_at || Date.now()),
        }));
        
        const totalChunks = parsedDocs.reduce((sum: number, d: VaultDocument) => sum + (d.chunks?.length || 0), 0);
        
        setState(prev => ({ 
          ...prev, 
          documents: parsedDocs, 
          totalChunks 
        }));
      }
    } catch (e) {
      console.error('[KnowledgeVault] Init failed:', e);
    }
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    const { data: { user } } = await backend.auth.getUser();
    if (!user) {
      toast({ title: 'Auth Required', description: 'Please sign in to upload to the Knowledge Vault.', variant: 'destructive' });
      return [];
    }

    setState(prev => ({ ...prev, isProcessing: true, progress: 0, stage: 'Reading files...', error: null }));

    try {
      const newDocs: VaultDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const docId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }));
        
        setState(prev => ({
          ...prev,
          progress: Math.round((i / files.length) * 40),
          stage: `Uploading ${file.name}...`,
        }));

        // Upload to Firebase Storage
        const storagePath = `${user.id}/${docId}/${file.name}`;
        const { error: uploadError } = await backend.storage.from('vault').upload(storagePath, file);
        
        if (uploadError) {
          console.error('[KnowledgeVault] Storage upload failed:', uploadError);
          // If storage bucket isn't enabled yet, just skip Cloud Storage, or we can error out.
          // We continue local processing to gracefully handle the case where storage isn't ready,
          // but we will still try to save to Firestore.
        }

        setState(prev => ({
          ...prev,
          progress: 40 + Math.round((i / files.length) * 40),
          stage: `Processing ${file.name}...`,
        }));

        let content = '';
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
          content = await file.text();
        } else {
          content = `[File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes]`;
        }

        const chunks = chunkText(content);

        const doc: VaultDocument = {
          id: docId,
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: content.slice(0, 50000), // limit size for firestore
          chunks,
          addedAt: new Date(),
          storagePath,
          user_id: user.id,
        };

        newDocs.push(doc);
      }

      setState(prev => ({ ...prev, progress: 90, stage: 'Saving to vault...' }));

      // Save to Firestore
      for (const doc of newDocs) {
        await backend.from('vault_documents').insert({
          ...doc,
          created_at: doc.addedAt.toISOString(),
        });
      }

      setState(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocs],
        totalChunks: prev.totalChunks + newDocs.reduce((sum, d) => sum + d.chunks.length, 0),
        isProcessing: false,
        progress: 100,
        stage: 'Complete!',
      }));

      return newDocs;
    } catch (e: any) {
      console.error('[KnowledgeVault] Add files failed:', e);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: e.message || 'Failed to process files',
      }));
      return [];
    }
  }, [toast]);

  const search = useCallback((query: string): string[] => {
    const allChunks = state.documents.flatMap(d => d.chunks || []);
    return searchChunks(query, allChunks);
  }, [state.documents]);

  const getContext = useCallback((query: string, maxTokens = 2000): string => {
    const results = search(query);
    let context = '';
    for (const chunk of results) {
      if ((context + chunk).length > maxTokens) break;
      context += chunk + '\n\n';
    }
    return context.trim();
  }, [search]);

  const removeDocument = useCallback(async (docId: string) => {
    try {
      const { data: { user } } = await backend.auth.getUser();
      if (!user) return;
      
      const doc = state.documents.find(d => d.id === docId);
      
      if (doc?.storagePath) {
        await backend.storage.from('vault').remove(doc.storagePath);
      }

      await backend.from('vault_documents').delete().eq('id', docId);

      setState(prev => {
        return {
          ...prev,
          documents: prev.documents.filter(d => d.id !== docId),
          totalChunks: prev.totalChunks - (doc?.chunks?.length || 0),
        };
      });
    } catch (e) {
      console.error('[KnowledgeVault] Remove failed:', e);
    }
  }, [state.documents]);

  const clearVault = useCallback(async () => {
    try {
      const { data: { user } } = await backend.auth.getUser();
      if (!user) return;

      setState(prev => ({ ...prev, isProcessing: true, stage: 'Clearing vault...' }));

      for (const doc of state.documents) {
        if (doc.storagePath) {
          await backend.storage.from('vault').remove(doc.storagePath);
        }
        await backend.from('vault_documents').delete().eq('id', doc.id);
      }

      setState(prev => ({ ...prev, documents: [], totalChunks: 0, isProcessing: false }));
    } catch (e) {
      console.error('[KnowledgeVault] Clear failed:', e);
      setState(prev => ({ ...prev, isProcessing: false, error: 'Failed to clear vault' }));
    }
  }, [state.documents]);

  return {
    ...state,
    initialize,
    addFiles,
    search,
    getContext,
    removeDocument,
    clearVault,
  };
};

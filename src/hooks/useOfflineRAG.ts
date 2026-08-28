/**
 * useOfflineRAG — retrieval over the on-device vector store.
 *
 * Thin adapter over useLocalVectorStore that exposes the shape research /
 * chat surfaces expect: `search()` returning `{ id, text, similarity, metadata }`
 * plus a `documentCount`.
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocalVectorStore } from '@/hooks/useLocalVectorStore';

export interface OfflineRagHit {
  id: string;
  text: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export function useOfflineRAG() {
  const store = useLocalVectorStore();
  const [documentCount, setDocumentCount] = useState(0);

  useEffect(() => {
    setDocumentCount(store.entryCount ?? 0);
  }, [store.entryCount]);

  const search = useCallback(
    async (query: string, topK = 5): Promise<OfflineRagHit[]> => {
      if (!query.trim()) return [];
      try {
        const results = await store.search(query, topK);
        return (results ?? []).map((r: any) => ({
          id: r.id,
          text: r.text,
          similarity: typeof r.score === 'number' ? r.score : 0,
          metadata: (r.metadata ?? {}) as Record<string, unknown>,
        }));
      } catch {
        return [];
      }
    },
    [store],
  );

  const addDocument = useCallback(
    async (text: string, metadata: Record<string, string> = {}) => {
      await store.addDocument(text, metadata);
      setDocumentCount((c) => c + 1);
    },
    [store],
  );

  return {
    isReady: store.isReady,
    documentCount,
    search,
    addDocument,
    clear: store.clearStore,
    initialize: store.initialize,
  };
}

export default useOfflineRAG;

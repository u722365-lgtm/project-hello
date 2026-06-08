/**
 * Odysseus-style local vector memory — ChromaDB pattern via IndexedDB + ONNX embeddings.
 */

import { openDB, type IDBPDatabase } from "idb";
import { embedText } from "@/lib/shadowtalkModel/embedding";

export type MemoryCategory = "chat" | "document" | "knowledge" | "manual";

export interface LocalMemoryEntry {
  id: string;
  text: string;
  embedding: number[];
  category: MemoryCategory;
  source?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MemorySearchResult {
  id: string;
  text: string;
  similarity: number;
  category: MemoryCategory;
  source?: string;
}

const DB_NAME = "shadowtalk-sovereign-memory";
const STORE = "vectors";
const META_STORE = "meta";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function countLocalMemories(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}

export async function upsertLocalMemory(opts: {
  text: string;
  id?: string;
  category?: MemoryCategory;
  source?: string;
  embedding?: number[];
}): Promise<string> {
  const text = opts.text.trim();
  if (text.length < 8) return opts.id ?? "";

  const id = opts.id ?? `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const embedding = opts.embedding ?? (await embedText(text.slice(0, 2000)));
  const now = Date.now();

  const entry: LocalMemoryEntry = {
    id,
    text: text.slice(0, 4000),
    embedding,
    category: opts.category ?? "chat",
    source: opts.source,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  const existing = (await db.get(STORE, id)) as LocalMemoryEntry | undefined;
  if (existing) {
    entry.createdAt = existing.createdAt;
  }
  await db.put(STORE, entry);
  return id;
}

export async function searchLocalMemories(
  query: string,
  limit = 5,
  minSimilarity = 0.32,
): Promise<MemorySearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedText(q.slice(0, 2000));
  } catch {
    return await keywordSearch(q, limit);
  }

  const db = await getDb();
  const all = (await db.getAll(STORE)) as LocalMemoryEntry[];

  return all
    .map((doc) => ({
      id: doc.id,
      text: doc.text,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      category: doc.category,
      source: doc.source,
    }))
    .filter((r) => r.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

async function keywordSearch(query: string, limit: number): Promise<MemorySearchResult[]> {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return [];

  return getAllLocalMemoriesSync()
    .then((all) =>
      all
        .map((doc) => {
          const lower = doc.text.toLowerCase();
          const hits = terms.filter((t) => lower.includes(t)).length;
          return {
            id: doc.id,
            text: doc.text,
            similarity: hits / terms.length,
            category: doc.category,
            source: doc.source,
          };
        })
        .filter((r) => r.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit),
    )
    .catch(() => []);
}

async function getAllLocalMemoriesSync(): Promise<LocalMemoryEntry[]> {
  const db = await getDb();
  return (await db.getAll(STORE)) as LocalMemoryEntry[];
}

export async function deleteLocalMemory(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function clearLocalMemories(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}

export async function exportLocalMemories(): Promise<LocalMemoryEntry[]> {
  return getAllLocalMemoriesSync();
}

export async function importLocalMemories(entries: LocalMemoryEntry[]): Promise<number> {
  const db = await getDb();
  let count = 0;
  for (const entry of entries) {
    if (!entry?.id || !entry?.text || !Array.isArray(entry.embedding)) continue;
    await db.put(STORE, entry);
    count++;
  }
  return count;
}

export function formatMemoryContext(results: MemorySearchResult[]): string {
  if (results.length === 0) return "";
  const lines = results.map(
    (r, i) => `${i + 1}. [${r.category}${r.source ? ` · ${r.source}` : ""}] ${r.text}`,
  );
  return `## LOCAL MEMORY (retrieved on-device)\nUse when relevant — stored privately on this machine:\n${lines.join("\n")}`;
}

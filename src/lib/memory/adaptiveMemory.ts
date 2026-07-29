/**
 * Adaptive long-term memory for ShadowTalk.
 *
 * Principles:
 * - Capture high-signal turns: user facts, preferences, decisions, tasks.
 * - Forget low-signal noise: pleasantries, filler, one-off errors.
 * - Expose compact recall packets for prompts/UI.
 * - Stay local-first by default; never require cloud storage.
 */

export interface MemoryFact {
  id: string;
  kind: 'fact' | 'preference' | 'decision' | 'task' | 'identity';
  content: string;
  confidence: number;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
  source?: string;
}

const STORAGE_KEY = 'shadowtalk_adaptive_memory_v2';

function hashContent(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (h << 5) - h + content.charCodeAt(i);
    h |= 0;
  }
  return `mem_${Math.abs(h).toString(36)}_${Date.now().toString(36)}`;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

function scoreContent(content: string): number {
  const trimmed = content.trim();
  if (!trimmed) return 0;
  if (trimmed.length < 5) return 0.1;
  if (trimmed.length > 300) return clampScore(0.3 + (trimmed.length / 3000));

  const identitySignals = /\b(my name is|i am|i'm|call me|i work|i live|i build|i'm from)\b/i;
  const preferenceSignals = /\b(i prefer|i like|i hate|don't like|always|never|must|should|remind me)\b/i;
  const decisionSignals = /\b(we decided|i decided|let's go with|chose|picking|going with|final)\b/i;
  const taskSignals = /\b(build|create|make|implement|ship|launch|deploy|fix|update|generate)\b/i;

  let score = 0.2;
  if (identitySignals.test(trimmed)) score += 0.4;
  if (preferenceSignals.test(trimmed)) score += 0.35;
  if (decisionSignals.test(trimmed)) score += 0.3;
  if (taskSignals.test(trimmed)) score += 0.2;

  const words = trimmed.split(/\s+/).length;
  if (words >= 8 && words <= 60) score += 0.15;

  return clampScore(score);
}

function classifyKind(content: string): MemoryFact['kind'] {
  const lower = content.toLowerCase();
  if (/\b(my name is|i am|i'm|call me|i work|i live|i build)\b/.test(lower)) return 'identity';
  if (/\b(i prefer|i like|i hate|don't like|always|never|remind me)\b/.test(lower)) return 'preference';
  if (/\b(we decided|i decided|let's go with|chose|picking|going with)\b/.test(lower)) return 'decision';
  if (/\b(build|create|make|implement|ship|launch|deploy|fix|update)\b/.test(lower)) return 'task';
  return 'fact';
}

function loadRaw(): MemoryFact[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: any) =>
        item &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0 &&
        typeof item.confidence === 'number',
    );
  } catch {
    return [];
  }
}

function saveRaw(facts: MemoryFact[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const trimmed = facts
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt || b.useCount - a.useCount)
      .slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full or unavailable
  }
}

export interface MemoryOptions {
  maxFacts?: number;
  minConfidence?: number;
}

export class AdaptiveMemory {
  private facts: MemoryFact[] = [];
  private options: MemoryOptions;

  constructor(options: MemoryOptions = {}) {
    this.options = {
      maxFacts: options.maxFacts ?? 300,
      minConfidence: options.minConfidence ?? 0.25,
    };
    this.facts = loadRaw();
  }

  ingest(conversationText: string, source?: string): MemoryFact[] {
    const sentences = conversationText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 8 && s.length <= 400);

    const added: MemoryFact[] = [];
    const now = Date.now();

    for (const sentence of sentences) {
      const confidence = scoreContent(sentence);
      if (confidence < this.options.minConfidence!) continue;

      const existing = this.facts.find(
        (f) => f.content.toLowerCase() === sentence.toLowerCase(),
      );

      if (existing) {
        existing.confidence = clampScore(existing.confidence + 0.05);
        existing.useCount += 1;
        existing.lastUsedAt = now;
        added.push(existing);
        continue;
      }

      const fact: MemoryFact = {
        id: hashContent(sentence),
        kind: classifyKind(sentence),
        content: sentence,
        confidence,
        createdAt: now,
        lastUsedAt: now,
        useCount: 1,
        source,
      };

      this.facts.push(fact);
      added.push(fact);
    }

    this.prune();
    saveRaw(this.facts);
    return added;
  }

  recall(query: string, limit = 12): MemoryFact[] {
    const q = query.toLowerCase();
    const scored = this.facts.map((fact) => {
      const contentMatch = fact.content.toLowerCase().includes(q) ? 0.45 : 0;
      const kindMatch =
        fact.kind === 'preference' || fact.kind === 'identity' ? 0.15 : 0;
      const recency = Math.max(0, 1 - (Date.now() - fact.lastUsedAt) / 1000 / 86400) * 0.2;
      const usage = Math.min(fact.useCount, 20) / 20 * 0.15;
      const confidenceBoost = fact.confidence * 0.05;
      return { fact, score: contentMatch + kindMatch + recency + usage + confidenceBoost };
    });

    return scored
      .filter((s) => s.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.fact);
  }

  getRecent(limit = 20): MemoryFact[] {
    return [...this.facts]
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, limit);
  }

  getTopFacts(limit = 40): MemoryFact[] {
    return [...this.facts]
      .sort((a, b) => b.useCount - a.useCount || b.confidence - a.confidence)
      .slice(0, limit);
  }

  clear(): void {
    this.facts = [];
    saveRaw([]);
  }

  private prune(): void {
    if (this.facts.length <= this.options.maxFacts!) return;
    this.facts = this.facts
      .sort((a, b) => b.confidence - a.confidence || b.useCount - a.useCount)
      .slice(0, this.options.maxFacts);
  }
}

export function buildRecallPacket(memory: AdaptiveMemory, query: string): string {
  const facts = memory.recall(query, 10);
  if (!facts.length) return '';

  const lines = facts.map((f) => `- [${f.kind}] ${f.content}`);
  return `[Memory hints]\n${lines.join('\n')}`;
}

/**
 * Smart context manager for ShadowTalk chat.
 *
 * Goals:
 * - Keep the active conversation within model attention limits.
 * - Preserve high-signal turns: user intent, decisions, files, tool results.
 * - Drop filler, greetings, and repeated status pings.
 * - Produce a compact system hint for stronger, faster replies.
 */

export interface ContextTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  tool?: string;
  importance?: number;
}

const FILLER_RE = /^(hi+!?|hey|hello|ok|okay|k|cool|nice|great|thanks+|thank you+|good|bad|hmm+|hm+|alright|let's start|begin now).*$/i;
const STATUS_RE = /^(analyzing|thinking|running|working on it|one moment|just a sec|please wait).*$/i;

function estimatedTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3.8));
}

function scoreTurn(turn: ContextTurn): number {
  const text = (turn.content || '').trim();
  if (!text) return 0;
  let score = 0.2;

  if (turn.role === 'system') score += 0.3;
  if (turn.tool) score += 0.35;
  if (/\b(decided|final|important|remember|must|never|always|build|implement|ship|launch|generate|create|fix|update|deploy)\b/i.test(text)) score += 0.4;
  if (/\b(prefer|like|hate|don't|always|never|remind)\b/i.test(text)) score += 0.3;
  if (/\b(error|failed|blocked|403|401|500|402|429|timeout)\b/i.test(text)) score += 0.25;
  if (text.length >= 80 && text.length <= 900) score += 0.2;
  if (/```[\s\S]{40,1200}```|```[\w-]+\n[\s\S]{20,800}\n```/.test(text)) score += 0.3;
  if (FILLER_RE.test(text)) score -= 0.5;
  if (STATUS_RE.test(text)) score -= 0.45;
  if (text.endsWith('?')) score += 0.15;

  return Math.max(0, Math.min(1, score));
}

export interface SmartContextOptions {
  targetInputTokens?: number;
  maxTurns?: number;
  reservedOutputTokens?: number;
}

export interface SmartContextResult {
  messages: ContextTurn[];
  dropped: number;
  inputTokens: number;
  systemHint: string;
}

export function buildSmartContext(
  turns: ContextTurn[],
  options: SmartContextOptions = {},
): SmartContextResult {
  const targetInputTokens = options.targetInputTokens ?? 3200;
  const maxTurns = options.maxTurns ?? 40;
  const reservedOutputTokens = options.reservedOutputTokens ?? 1200;

  const scored = turns
    .map((turn) => ({ turn, score: scoreTurn(turn) }))
    .sort((a, b) => b.score - a.score);

  let selected: ContextTurn[] = [];
  let inputTokens = 0;
  let dropped = 0;

  for (const item of scored) {
    if (selected.length >= maxTurns) break;
    const tokens = estimatedTokens(item.turn.content || '');
    if (inputTokens + tokens > targetInputTokens - reservedOutputTokens) continue;
    selected.push(item.turn);
    inputTokens += tokens;
  }

  selected.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  dropped = turns.length - selected.length;

  const highImportance = selected
    .filter((t) => (t.importance ?? scoreTurn(t)) >= 0.65)
    .slice(-8);

  const facts = highImportance
    .map((t) => `- ${t.content.replace(/[\r\n]+/g, ' ').trim()}`)
    .join('\n');

  const systemHint = facts
    ? `[Context boost]\nPreserve these points:\n${facts}`
    : '';

  return {
    messages: selected,
    dropped,
    inputTokens,
    systemHint,
  };
}

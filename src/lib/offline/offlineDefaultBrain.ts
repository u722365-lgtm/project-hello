/**
 * Offline default model "brain" — curated ShadowTalk knowledge for Tier A (SmolLM).
 *
 * We cannot fine-tune on the entire internet in-browser. Instead we:
 * 1. Inject product + AEO corpus facts into the system prompt
 * 2. Retrieve relevant Q&A chunks per user query (keyword RAG)
 * 3. Seed the sovereign learning corpus once on first model load
 */

import { AEO_ANSWER_CORPUS } from "@/lib/aeo/answerCorpus";
import { SHADOWTALK_SELF_KNOWLEDGE_BRIEF } from "@/lib/shadowTalkProductKnowledge";

export type OfflineKnowledgeChunk = {
  id: string;
  text: string;
  score: number;
};

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
  "from", "up", "about", "into", "through", "during", "before", "after",
  "above", "below", "between", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "each", "few",
  "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "just", "and", "but", "if",
  "or", "because", "as", "until", "while", "what", "which", "who", "whom",
  "this", "that", "these", "those", "am", "it", "its", "i", "me", "my",
  "you", "your", "we", "our", "they", "them", "their", "he", "she", "his",
  "her",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Keyword retrieval over AEO corpus — no embedding model required (CPU-safe for Tier A). */
export function retrieveOfflineKnowledge(
  query: string,
  maxChunks = 4,
): OfflineKnowledgeChunk[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return AEO_ANSWER_CORPUS.slice(0, maxChunks).map((a, i) => ({
      id: a.id,
      text: `Q: ${a.question}\nA: ${a.answer}`,
      score: maxChunks - i,
    }));
  }

  const scored = AEO_ANSWER_CORPUS.map((entry) => {
    const haystack = `${entry.question} ${entry.answer} ${entry.keywords.join(" ")}`.toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (haystack.includes(token)) score += 1;
      if (entry.question.toLowerCase().includes(token)) score += 2;
      if (entry.keywords.some((k) => k.toLowerCase().includes(token))) score += 1.5;
    }
    return { id: entry.id, text: `Q: ${entry.question}\nA: ${entry.answer}`, score };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

  if (scored.length > 0) return scored;

  return AEO_ANSWER_CORPUS.filter((a) =>
    ["product", "google", "features"].includes(a.category),
  )
    .slice(0, maxChunks)
    .map((a, i) => ({
      id: a.id,
      text: `Q: ${a.question}\nA: ${a.answer}`,
      score: maxChunks - i,
    }));
}

const TIER_A_BASE_PROMPT =
  "You are ShadowTalk AI (default on-device model, Tier A). Answer using the knowledge below. " +
  "Be concise and accurate. If unsure, say so and suggest /docs or /faq. Do not invent features or prices.";

export function buildTierASystemPrompt(
  messages: Array<{ role: string; content: string }>,
  userQuery?: string,
): string {
  const existingSystem = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n\n");

  const lastUser =
    userQuery?.trim() ||
    [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ||
    "";

  const retrieved = retrieveOfflineKnowledge(lastUser, 4);
  const retrievalBlock =
    retrieved.length > 0
      ? "## Relevant facts (retrieved offline)\n" + retrieved.map((c) => c.text).join("\n\n")
      : "";

  const parts = [
    TIER_A_BASE_PROMPT,
    `## Product brief\n${SHADOWTALK_SELF_KNOWLEDGE_BRIEF}`,
    existingSystem ? `## Session context\n${existingSystem.slice(0, 2000)}` : "",
    retrievalBlock,
  ].filter(Boolean);

  return parts.join("\n\n").slice(0, 6000);
}

export function mergeMessagesForTierA(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const nonSystem = messages.filter((m) => m.role !== "system");
  const lastUser = [...nonSystem].reverse().find((m) => m.role === "user")?.content;
  const systemPrompt = buildTierASystemPrompt(messages, lastUser);
  return [{ role: "system", content: systemPrompt }, ...nonSystem.slice(-12)];
}

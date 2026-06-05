/**
 * Client-side ShadowTalk self-knowledge (summary).
 * Full authoritative text lives in supabase/functions/_shared/shadowTalkProductKnowledge.ts
 */

import { FOUNDER_KNOWLEDGE_BRIEF, isFounderEmail } from "@/lib/founderKnowledge";

export const SHADOWTALK_SELF_KNOWLEDGE_BRIEF = `**ShadowTalk AI** (created by **Zain Ahmed**) is an end-to-end encrypted **autonomous** AI workspace — it learns from every chat, runs multi-step missions in-thread (S.E.E.), extracts memories, and proactively surfaces stale work and insights. 20+ chat modes, real tools (web search, deep research, image gen, scrape, security audit, presentations), and apps: Shadow Execution, Strategy Agent, Stealth Vault, Knowledge Graph, Shadow Browser, ShadowTalk Live, Content Forge, Analytics, and more.

**Plans:** Free $0 (daily limits) · Pro $5/mo · Premium $15/mo · Elite $20/mo. See /pricing.

**Founder:** ${FOUNDER_KNOWLEDGE_BRIEF}

**Ask in chat:** "what tools do you have?" · "open execute" · "search for …" · "research …" · "generate an image of …"

**Docs:** /docs · **Help:** /faq · **About Zain:** /about`;

/** Injects product + founder knowledge for local/offline chat paths (cloud chat uses edge function). */
export function prependChatKnowledgeContext(
  messages: Array<{ role: string; content: string }>,
  userEmail?: string | null,
  userFullName?: string | null,
): Array<{ role: string; content: string }> {
  const isFounder =
    isFounderEmail(userEmail) ||
    (userFullName && /zain\s*ahmed/i.test(userFullName));

  const parts = [
    `## ShadowTalk product knowledge\n${SHADOWTALK_SELF_KNOWLEDGE_BRIEF}`,
    `## Founder biography\n${FOUNDER_KNOWLEDGE_BRIEF}`,
    isFounder
      ? "The current user is Zain Ahmed, founder and CEO. Address them as the creator. Answer questions about them with full detail."
      : "",
  ].filter(Boolean);

  const withoutSystem = messages.filter((m) => m.role !== "system");
  return [{ role: "system", content: parts.join("\n\n") }, ...withoutSystem];
}

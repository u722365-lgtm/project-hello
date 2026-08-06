/**
 * Client-side founder knowledge (summary).
 * Full authoritative text: backend/functions/_shared/founderKnowledge.ts
 */

export const FOUNDER_KNOWLEDGE_BRIEF = `**Zain Ahmed** — CEO & Founder of ShadowTalk AI. 17, from Karachi, Pakistan. Built ShadowTalk (sovereign E2EE AI workspace), SocialSync (23+ businesses in 24h), offline LLM stack. Mentored by Sir Zia Khan (Governor Sindh IT Initiative). Mission: intelligence you own, not rent. Full story: /about`;

export const FOUNDER_EMAILS = [
  "zaim98269@gmail.com",
  "j3451500@gmail.com",
  "laibaanis345@gmail.com",
] as const;

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (FOUNDER_EMAILS as readonly string[]).includes(email.toLowerCase());
}

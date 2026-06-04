import { BRAND } from "@/lib/brand";
import { buildAppShareUrl } from "@/lib/growth/shareGrowth";

const SITE_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://www.shadowtalk-ai.com";

const SHARE_BANNER_DAY_KEY = "shadowtalk_share_banner_day";

/** Substantive AI replies are worth a one-tap share prompt. */
export function isShareWorthyReply(text: string): boolean {
  const t = text.trim();
  if (t.length >= 400) return true;
  if (/```[\s\S]{60,}/.test(t)) return true;
  if (/^#{1,3}\s+\S/m.test(t) && t.length >= 180) return true;
  return false;
}

export function buildChatShareTitle(userPrompt: string, assistantReply: string): string {
  const heading = assistantReply.match(/^#{1,3}\s+(.+)$/m);
  if (heading?.[1]) return heading[1].trim().slice(0, 100);

  const line = assistantReply
    .replace(/[#*`]/g, "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 24);
  if (line) return line.slice(0, 100);

  const prompt = userPrompt.trim();
  if (prompt.length > 12) return `ShadowTalk: ${prompt.slice(0, 72)}`;
  return "What I built with ShadowTalk AI";
}

export function buildChatShareSubtitle(userPrompt: string): string | undefined {
  const p = userPrompt.trim();
  if (!p) return undefined;
  return p.length > 140 ? `${p.slice(0, 137)}…` : p;
}

/** Clipboard footer — every copy becomes a soft referral link. */
export function formatCopyWithAttribution(body: string, ref?: string | null): string {
  const link = buildAppShareUrl({
    path: "/chatbot",
    ref: ref ?? null,
    utm: { source: "copy", medium: "clipboard", campaign: "chat_attribution" },
  });
  return `${body.trim()}\n\n---\n${BRAND.mnemonic} · ${BRAND.fullName}\n${link}`;
}

/** Tweet-ready line for native share / social. */
export function buildViralShareBlurb(title: string): string {
  return `I just used ${BRAND.fullName} for this — ${title.slice(0, 90)}. ${BRAND.mnemonic}`;
}

export function shouldShowChatShareBanner(): boolean {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(SHARE_BANNER_DAY_KEY);
    const parsed = raw ? (JSON.parse(raw) as { day: string; count: number }) : null;
    if (!parsed || parsed.day !== day) return true;
    return parsed.count < 2;
  } catch {
    return true;
  }
}

export function recordChatShareBannerShown(): void {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(SHARE_BANNER_DAY_KEY);
    const parsed = raw ? (JSON.parse(raw) as { day: string; count: number }) : { day, count: 0 };
    const count = parsed.day === day ? parsed.count + 1 : 1;
    localStorage.setItem(SHARE_BANNER_DAY_KEY, JSON.stringify({ day, count }));
  } catch {
    /* ignore */
  }
}

export function getPublicSiteOrigin(): string {
  return SITE_ORIGIN;
}

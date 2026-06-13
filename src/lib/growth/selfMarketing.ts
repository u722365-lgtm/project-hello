import { BRAND } from "@/lib/brand";
import { buildAppShareUrl } from "@/lib/growth/shareGrowth";
import { isShareAmplificationActive } from "@/lib/shadowScale/shadowScaleSignals";

const SITE_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://www.shadowtalk-ai.com";

const SHARE_BANNER_DAY_KEY = "shadowtalk_share_banner_day";

/** Substantive AI replies are worth a one-tap share prompt. */
export function isShareWorthyReply(text: string): boolean {
  const t = text.trim();
  const minLen = isShareAmplificationActive() ? 280 : 400;
  if (t.length >= minLen) return true;
  if (/```[\s\S]{40,}/.test(t)) return true;
  if (/^#{1,3}\s+\S/m.test(t) && t.length >= (isShareAmplificationActive() ? 140 : 180)) return true;
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

export function buildEnterpriseInviteUrl(): string {
  const url = new URL(
    buildAppShareUrl({
      path: "/auth",
      ref: null,
      utm: { source: "colleague", medium: "invite", campaign: "enterprise_rollout" },
    }),
  );
  url.searchParams.set("enterprise", "1");
  return url.toString();
}

/** Clipboard footer — every copy becomes a soft referral link. */
export function formatCopyWithAttribution(
  body: string,
  ref?: string | null,
  opts?: { enterprise?: boolean },
): string {
  const fullLink = opts?.enterprise
    ? buildEnterpriseInviteUrl()
    : buildAppShareUrl({
        path: "/chatbot",
        ref: ref ?? null,
        utm: { source: "copy", medium: "clipboard", campaign: "chat_attribution" },
      });
  const footer = opts?.enterprise
    ? `Shared via ${BRAND.fullName} — invite colleagues with your work email:\n${fullLink}`
    : `${BRAND.mnemonic} · ${BRAND.fullName}\n${fullLink}`;
  return `${body.trim()}\n\n---\n${footer}`;
}

/** Tweet-ready line for native share / social. */
export function buildViralShareBlurb(title: string, opts?: { colleague?: boolean; orgName?: string }): string {
  if (opts?.colleague && opts.orgName) {
    return `I used ${BRAND.fullName} at ${opts.orgName} for this — ${title.slice(0, 80)}. Try it with your work email.`;
  }
  return `I just used ${BRAND.fullName} for this — ${title.slice(0, 90)}. ${BRAND.mnemonic}`;
}

export function shouldShowChatShareBanner(): boolean {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(SHARE_BANNER_DAY_KEY);
    const parsed = raw ? (JSON.parse(raw) as { day: string; count: number }) : null;
    const dailyCap = getShareBannerDailyCap();
    if (!parsed || parsed.day !== day) return true;
    return parsed.count < dailyCap;
  } catch {
    return true;
  }
}

function getShareBannerDailyCap(): number {
  return isShareAmplificationActive() ? 8 : 3;
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

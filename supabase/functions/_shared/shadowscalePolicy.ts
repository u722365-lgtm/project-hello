/** Shared growth policy helpers for ShadowScale orchestrator + worker */

export type ScaleConfig = {
  enabled?: boolean;
  autopilot?: boolean;
  ethical_mode?: boolean;
  max_emails_per_day?: number;
  max_announcements_per_day?: number;
};

export function ethicalCopy(text: string, ethical: boolean): string {
  if (!ethical) return text;
  return text
    .replace(/\bviral\b/gi, "shareable")
    .replace(/\bhype\b/gi, "update")
    .replace(/\bblast\b/gi, "notify");
}

export async function countTodayAnnouncements(
  admin: { from: (t: string) => { select: (c: string, o?: object) => { gte: (col: string, v: string) => Promise<{ count: number | null }> } } },
): Promise<number> {
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const { count } = await admin
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayStart);
  return count ?? 0;
}

export async function canPostAnnouncement(config: ScaleConfig | null, admin: unknown): Promise<boolean> {
  const max = config?.max_announcements_per_day ?? 5;
  const today = await countTodayAnnouncements(admin as Parameters<typeof countTodayAnnouncements>[0]);
  return today < max;
}

export const LOW_RISK_ACTIONS = new Set([
  "referral_campaign",
  "changelog_nudge",
  "share_campaign",
  "in_app_announcement_draft",
  "video_studio_promo",
  "re_engagement_nudge",
]);

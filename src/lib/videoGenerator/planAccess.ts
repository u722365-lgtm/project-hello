import type { PlanTier } from "@/hooks/useFeatureGating";

/** Pro & Elite (+ premium/lifetime/enterprise) — not free */
const VIDEO_STUDIO_PLANS: PlanTier[] = [
  "pro",
  "premium",
  "elite",
  "lifetime",
  "enterprise",
];

export function canAccessVideoStudio(plan: PlanTier, hasSpecialAccess = false): boolean {
  if (hasSpecialAccess) return true;
  return VIDEO_STUDIO_PLANS.includes(plan);
}

export const VIDEO_STUDIO_FEATURE_KEY = "videoStudio";

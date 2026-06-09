import { SUBSCRIPTION_TIERS } from "@/lib/monetization";

export type PaidPlanId = "pro" | "premium" | "elite";

/** PKR equivalents for Pakistan wallets (approximate, update as needed) */
export const PKR_MONTHLY: Record<PaidPlanId, number> = {
  pro: 1499,
  premium: 3999,
  elite: 5999,
};

export function resolvePlanAmountUsd(planKey: string): number {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === planKey);
  if (tier && typeof tier.price === "number") return tier.price;
  if (planKey.startsWith("credits-")) {
    const id = planKey.replace("credits-", "");
    return 0;
  }
  return 20;
}

export function normalizePlanType(planKey: string): PaidPlanId | string {
  if (planKey === "pro" || planKey === "premium" || planKey === "elite") return planKey;
  if (planKey.startsWith("credits-")) return planKey;
  if (planKey.startsWith("api-") || planKey.startsWith("wl-") || planKey.startsWith("solution-")) {
    return "elite";
  }
  return "pro";
}

export function planDisplayName(planKey: string): string {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === planKey);
  return tier?.name ?? planKey;
}

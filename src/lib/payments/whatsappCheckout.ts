import { PKR_MONTHLY, planDisplayName, resolvePlanAmountUsd, type PaidPlanId } from "./planPricing";

const WHATSAPP_NUMBER = "923211798561";

export function buildCheckoutWhatsAppMessage(options: {
  planKey: string;
  currency?: "USD" | "PKR";
  userEmail?: string | null;
  international?: boolean;
}): string {
  const { planKey, currency = "PKR", userEmail, international = false } = options;
  const planName = planDisplayName(planKey);
  const paidPlans: PaidPlanId[] = ["pro", "premium", "elite"];
  const isPaidMonthly = paidPlans.includes(planKey as PaidPlanId);

  let amountLabel: string;
  if (international) {
    const usd = resolvePlanAmountUsd(planKey);
    amountLabel = typeof usd === "number" && usd > 0 ? `$${usd}` : "[amount]";
  } else if (currency === "PKR" && isPaidMonthly) {
    amountLabel = `Rs ${PKR_MONTHLY[planKey as PaidPlanId].toLocaleString()}`;
  } else {
    const usd = resolvePlanAmountUsd(planKey);
    amountLabel = typeof usd === "number" && usd > 0 ? `$${usd}` : "[amount]";
  }

  if (international) {
    const email = userEmail?.trim() || "[your account email]";
    return `Hi Zain, I'm an international founder. I sent ${amountLabel} for the ${planName} Plan. My account email is ${email}. Here is my receipt screenshot.`;
  }

  return `Hi Zain, I just transferred ${amountLabel} for the ${planName} Plan. Here is my receipt screenshot.`;
}

export function buildCheckoutWhatsAppUrl(options: {
  planKey: string;
  currency?: "USD" | "PKR";
  userEmail?: string | null;
  international?: boolean;
}): string {
  const text = buildCheckoutWhatsAppMessage(options);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

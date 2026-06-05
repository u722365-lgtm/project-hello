import { enterprisePlanForEmail } from "@/lib/enterpriseTenants";

export type UserPlan = "free" | "pro" | "premium" | "lifetime" | "elite" | "enterprise";

const PRODUCT_PLANS: Record<string, UserPlan> = {
  prod_TZocSSpPddFCH1: "pro",
  prod_TbiuwlUUg3F17C: "premium",
  prod_TbhEVUPSLMSF53: "elite",
  prod_TbivJcOChrAcvq: "enterprise",
};

const PLAN_ALIASES: Record<string, UserPlan> = {
  free: "free",
  pro: "pro",
  premium: "premium",
  lifetime: "lifetime",
  elite: "elite",
  enterprise: "enterprise",
};

const SPECIAL_ACCESS_EMAILS = [
  "j3451500@gmail.com",
  "almadadali00@gmail.com",
  "zaim98269@gmail.com",
  "laibaanis345@gmail.com",
];

export function hasSpecialAccessEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SPECIAL_ACCESS_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase());
}

export function resolvePlanFromCheckSubscription(
  email: string | null | undefined,
  data: {
    subscribed?: boolean;
    plan?: string;
    product_id?: string;
    subscription_end?: string | null;
  } | null,
): { plan: UserPlan; subscribed: boolean; subscriptionEnd: string | null } {
  if (hasSpecialAccessEmail(email)) {
    return { plan: "elite", subscribed: true, subscriptionEnd: null };
  }

  const enterprise = enterprisePlanForEmail(email);
  if (enterprise) {
    return { plan: enterprise, subscribed: true, subscriptionEnd: null };
  }

  if (!data) {
    return { plan: "free", subscribed: false, subscriptionEnd: null };
  }

  const planKey = (data.plan ?? "").toLowerCase();
  if (data.subscribed && PLAN_ALIASES[planKey]) {
    return {
      plan: PLAN_ALIASES[planKey],
      subscribed: true,
      subscriptionEnd: data.subscription_end ?? null,
    };
  }

  if (data.subscribed && data.product_id) {
    return {
      plan: PRODUCT_PLANS[data.product_id] ?? "pro",
      subscribed: true,
      subscriptionEnd: data.subscription_end ?? null,
    };
  }

  return { plan: "free", subscribed: false, subscriptionEnd: null };
}

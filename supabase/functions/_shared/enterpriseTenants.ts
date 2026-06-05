export type PlanId = "free" | "pro" | "premium" | "elite" | "enterprise";

const DEFAULT_ENTERPRISE_DOMAINS = ["shanfoods.com", "shan.com", "shanfood.com"];

export function enterpriseDomainsFromEnv(): string[] {
  const raw = Deno.env.get("ENTERPRISE_EMAIL_DOMAINS") ?? "";
  const fromEnv = raw.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  return [...new Set([...DEFAULT_ENTERPRISE_DOMAINS, ...fromEnv])];
}

export function isEnterpriseEmail(email: string | null | undefined): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return enterpriseDomainsFromEnv().includes(domain);
}

export function enterprisePlanForEmail(email: string | null | undefined): PlanId | null {
  return isEnterpriseEmail(email) ? "enterprise" : null;
}

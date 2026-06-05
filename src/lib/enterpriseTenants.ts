import type { PlanTier } from "@/hooks/useFeatureGating";

export interface EnterpriseTenant {
  id: string;
  name: string;
  domains: string[];
  plan: PlanTier;
  welcomeTitle: string;
  welcomeSubtitle: string;
  quickPrompts: { label: string; prompt: string }[];
}

/** Built-in enterprise tenants — extend via VITE_ENTERPRISE_DOMAINS */
export const ENTERPRISE_TENANTS: EnterpriseTenant[] = [
  {
    id: "shan-foods",
    name: "Shan Foods",
    domains: ["shanfoods.com", "shan.com", "shanfood.com"],
    plan: "enterprise",
    welcomeTitle: "Shan Foods AI Workspace",
    welcomeSubtitle: "Research, documents, analysis, and execution — one secure chat for every team.",
    quickPrompts: [
      { label: "Product brief", prompt: "Draft a product launch brief for " },
      { label: "Market research", prompt: "Research the market for " },
      { label: "SOP / process", prompt: "Write a standard operating procedure for " },
      { label: "Email draft", prompt: "Draft a professional email about " },
      { label: "Data summary", prompt: "Summarize these findings and recommend next steps: " },
    ],
  },
];

function extraDomains(): string[] {
  const raw = import.meta.env.VITE_ENTERPRISE_DOMAINS as string | undefined;
  if (!raw) return [];
  return raw.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
}

export function emailDomain(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[1]?.toLowerCase() ?? "";
}

export function resolveEnterpriseTenant(email: string | null | undefined): EnterpriseTenant | null {
  const domain = emailDomain(email);
  if (!domain) return null;

  const extras = extraDomains();
  for (const tenant of ENTERPRISE_TENANTS) {
    if (tenant.domains.includes(domain) || extras.includes(domain)) {
      return tenant;
    }
  }

  if (extras.includes(domain)) {
    return {
      id: "custom-enterprise",
      name: domain,
      domains: [domain],
      plan: "enterprise",
      welcomeTitle: "Enterprise AI Workspace",
      welcomeSubtitle: "Unlimited team chat, research, and document tools.",
      quickPrompts: ENTERPRISE_TENANTS[0].quickPrompts,
    };
  }

  return null;
}

export function isEnterpriseEmail(email: string | null | undefined): boolean {
  return resolveEnterpriseTenant(email) !== null;
}

export function enterprisePlanForEmail(email: string | null | undefined): PlanTier | null {
  return resolveEnterpriseTenant(email)?.plan ?? null;
}

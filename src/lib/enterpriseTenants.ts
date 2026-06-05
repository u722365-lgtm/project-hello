import type { PlanTier } from "@/hooks/useFeatureGating";

export interface EnterpriseTenant {
  id: string;
  name: string;
  domains: string[];
  plan: PlanTier;
  welcomeTitle: string;
  welcomeSubtitle: string;
  signInHint: string;
  inviteMessage: string;
  quickPrompts: { label: string; prompt: string }[];
  onboardingSteps: { title: string; body: string }[];
  helpTips: { title: string; body: string }[];
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
    signInHint: "Use your official @shanfoods.com work email to unlock unlimited AI for your role.",
    inviteMessage: "Join me on ShadowTalk — our team's AI workspace. Sign in with your @shanfoods.com email.",
    quickPrompts: [
      { label: "Product brief", prompt: "Draft a product launch brief for " },
      { label: "Market research", prompt: "Research the market and competitors for " },
      { label: "SOP / process", prompt: "Write a standard operating procedure for " },
      { label: "Email draft", prompt: "Draft a professional email to stakeholders about " },
      { label: "Meeting notes", prompt: "Turn these notes into action items and owners: " },
      { label: "Data summary", prompt: "Summarize these findings and recommend next steps: " },
    ],
    onboardingSteps: [
      {
        title: "Ask in plain language",
        body: "Type what you need — research, emails, SOPs, summaries, or analysis. ShadowTalk plans and executes multi-step work.",
      },
      {
        title: "Use quick actions",
        body: "Tap a suggested prompt below the greeting to start faster. You can edit the text before sending.",
      },
      {
        title: "Attach files & images",
        body: "Use the + button to upload documents or photos. Ask ShadowTalk to analyze, summarize, or edit them.",
      },
      {
        title: "Your history is saved",
        body: "Every chat is saved to History (search icon). Pick up where you left off on phone or desktop.",
      },
    ],
    helpTips: [
      { title: "Deep research", body: "Say “research latest trends in …” for live web sources with citations." },
      { title: "Documents", body: "Ask for Word-style reports, PDF exports, or presentation outlines." },
      { title: "Voice", body: "Tap the mic for voice input where supported." },
      { title: "Mobile", body: "On iPhone: Share → Add to Home Screen for full-screen app experience." },
      { title: "Invite colleagues", body: "Tap Invite in the welcome banner or help menu — share ShadowTalk with teammates using their work email." },
      { title: "Support", body: "For access issues, contact your IT admin with your work email address." },
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
      signInHint: `Sign in with your @${domain} work email.`,
      inviteMessage: `Join me on ShadowTalk — our team's AI workspace. Sign in with your @${domain} email.`,
      quickPrompts: ENTERPRISE_TENANTS[0].quickPrompts,
      onboardingSteps: ENTERPRISE_TENANTS[0].onboardingSteps,
      helpTips: ENTERPRISE_TENANTS[0].helpTips,
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

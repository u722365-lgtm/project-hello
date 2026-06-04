import type { DeliverableType } from "@/lib/execution/types";

export type ExecutionTemplate = {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: "research" | "content" | "business" | "engineering" | "ceo";
  deliverableType: DeliverableType;
  ceoPreset?: { description: string; targetMarket: string };
};

export const EXECUTION_TEMPLATE_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "ceo", label: "CEO playbooks" },
  { key: "research", label: "Research" },
  { key: "business", label: "Business" },
  { key: "content", label: "Content" },
  { key: "engineering", label: "Engineering" },
] as const;

export const EXECUTION_TEMPLATES: ExecutionTemplate[] = [
  {
    id: "ceo-board",
    label: "Board Meeting Prep",
    icon: "📊",
    category: "ceo",
    deliverableType: "strategy_report",
    prompt: "Board meeting package for my company",
    ceoPreset: {
      description:
        "Prepare a comprehensive board meeting package: quarterly performance, financial highlights, KPIs, strategic initiatives, risk register, and proposed resolutions.",
      targetMarket: "Board of Directors, Investors",
    },
  },
  {
    id: "ceo-investor",
    label: "Investor Update",
    icon: "🚀",
    category: "ceo",
    deliverableType: "strategy_report",
    prompt: "Investor update for my startup",
    ceoPreset: {
      description:
        "Create an investor update: headline metrics, wins, product roadmap, team, challenges, next-quarter goals, and asks.",
      targetMarket: "Investors, Advisory Board",
    },
  },
  {
    id: "market-expansion",
    label: "Market Expansion",
    icon: "🌍",
    category: "ceo",
    deliverableType: "strategy_report",
    prompt: "Market expansion analysis",
    ceoPreset: {
      description:
        "Market expansion analysis: TAM, competitors, regulations, GTM options, resources, risks, phased timeline.",
      targetMarket: "C-Suite, Strategy Team",
    },
  },
  {
    id: "competitor-strategy",
    label: "Competitor Strategy",
    icon: "📈",
    category: "research",
    deliverableType: "strategy_report",
    prompt: "Competitive landscape and positioning strategy for [product] in [location]",
  },
  {
    id: "market-research",
    label: "Market Research",
    icon: "🛒",
    category: "research",
    deliverableType: "general",
    prompt: "Research competitors, market trends, and pricing strategies for [product]",
  },
  {
    id: "deep-research",
    label: "Deep Research",
    icon: "🔍",
    category: "research",
    deliverableType: "research_brief",
    prompt: "Multi-source research with citations on [topic] — executive brief",
  },
  {
    id: "lead-gen",
    label: "Lead Generation",
    icon: "🌐",
    category: "business",
    deliverableType: "general",
    prompt: "Find 10 qualified leads for [industry] in [location], verify contact info, draft intro emails",
  },
  {
    id: "seo-audit",
    label: "SEO Audit",
    icon: "📊",
    category: "business",
    deliverableType: "general",
    prompt: "Complete SEO audit of [website]: keywords, backlinks, technical issues, action plan",
  },
  {
    id: "security-audit",
    label: "Security Audit",
    icon: "🛡️",
    category: "engineering",
    deliverableType: "general",
    prompt: "Security audit: OWASP top 10, dependency vulnerabilities, remediation plan for [url]",
  },
  {
    id: "blog-writer",
    label: "Blog Writer",
    icon: "✍️",
    category: "content",
    deliverableType: "content_pack",
    prompt: "Research and write a 2000-word SEO blog post on [topic] with sources",
  },
  {
    id: "content-pipeline",
    label: "Content Pipeline",
    icon: "📱",
    category: "content",
    deliverableType: "content_pack",
    prompt: "Generate a week of social content: captions, hashtags, image prompts for [brand]",
  },
];

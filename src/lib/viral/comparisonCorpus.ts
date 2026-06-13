/**
 * Programmatic comparison pages — organic traffic without founder posting.
 * Synced to public/vs/*.html for crawlers + React routes at /vs/:slug
 */

export type ComparisonSlug = "chatgpt" | "perplexity" | "claude" | "gemini" | "copilot";

export interface ComparisonPage {
  slug: ComparisonSlug;
  competitor: string;
  title: string;
  metaDescription: string;
  h1: string;
  verdict: string;
  shadowtalkWins: string[];
  competitorWins: string[];
  keywords: string[];
}

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: "chatgpt",
    competitor: "ChatGPT",
    title: "ShadowTalk vs ChatGPT — Best Agentic AI Workspace (2026)",
    metaDescription:
      "ShadowTalk AI vs ChatGPT: Mission Control missions, 30+ tools, encrypted chat, code IDE, and desktop app — free start. Compare features, pricing, and privacy.",
    h1: "ShadowTalk vs ChatGPT",
    verdict:
      "ChatGPT excels at single-turn chat. ShadowTalk AI finishes multi-step jobs with Mission Control, tool chains, E2EE chat, and a full developer workspace — starting free at shadowtalk-ai.com.",
    shadowtalkWins: [
      "Mission Control — autonomous multi-step missions with approval gates",
      "30+ integrated tools (research, code, images, security) from one chat",
      "End-to-end encrypted chat + Stealth Vault",
      "In-browser IDE, presentations, and desktop app",
      "Pro from $5/mo vs ChatGPT Plus pricing for more integrated tooling",
      "BYOK + optional on-device offline models",
    ],
    competitorWins: [
      "Larger default model brand recognition",
      "Massive plugin ecosystem via OpenAI",
      "Strong single-shot reasoning on GPT-4o class models",
    ],
    keywords: ["ChatGPT alternative", "ShadowTalk vs ChatGPT", "best AI workspace"],
  },
  {
    slug: "perplexity",
    competitor: "Perplexity",
    title: "ShadowTalk vs Perplexity — Research + Execution in One Workspace",
    metaDescription:
      "ShadowTalk AI vs Perplexity: cited deep research plus agentic execution — code IDE, missions, encrypted vault. Not just answers — finished work.",
    h1: "ShadowTalk vs Perplexity",
    verdict:
      "Perplexity leads at search-style cited answers. ShadowTalk adds Mission Control, code IDE, presentations, and encrypted storage so you research and act in the same workspace.",
    shadowtalkWins: [
      "Deep Research with citations plus agentic follow-through",
      "Mission Control for approved multi-step workflows",
      "Code IDE, App Builder, and presentation export",
      "Encrypted vault for sensitive project context",
      "Voice mode and 20+ specialized chat modes",
    ],
    competitorWins: [
      "Focused search UI with strong source cards",
      "Fast factual lookup for simple questions",
    ],
    keywords: ["Perplexity alternative", "ShadowTalk vs Perplexity", "AI research workspace"],
  },
  {
    slug: "claude",
    competitor: "Claude",
    title: "ShadowTalk vs Claude — Agentic Workspace vs Reasoning Chat",
    metaDescription:
      "ShadowTalk AI vs Claude: combine Anthropic-quality reasoning (BYOK) with missions, tools, browser, and vault in one product at shadowtalk-ai.com.",
    h1: "ShadowTalk vs Claude",
    verdict:
      "Claude shines at long-form reasoning. ShadowTalk wraps agentic missions, live web tools, and encrypted storage around your models — including BYOK for Claude API keys.",
    shadowtalkWins: [
      "BYOK — use your Anthropic API keys inside ShadowTalk",
      "Mission Control + Shadow Browser for live web tasks",
      "Tool chain from natural language (not just chat)",
      "Team workspace, marketplace agents, desktop app",
      "Privacy vault and transparency pages",
    ],
    competitorWins: [
      "Exceptional long-context document analysis",
      "Polished artifact and writing experience",
    ],
    keywords: ["Claude alternative", "ShadowTalk vs Claude", "agentic Claude workspace"],
  },
  {
    slug: "gemini",
    competitor: "Gemini",
    title: "ShadowTalk vs Gemini — Sovereign Agentic AI Workspace",
    metaDescription:
      "ShadowTalk AI vs Google Gemini: privacy-first agentic workspace with encrypted chat, offline models, and Mission Control — not locked to one ecosystem.",
    h1: "ShadowTalk vs Gemini",
    verdict:
      "Gemini integrates deeply with Google. ShadowTalk is ecosystem-neutral with E2EE, local WebGPU models, and open BYOK — built to finish jobs across tools.",
    shadowtalkWins: [
      "Not tied to Google account or Workspace",
      "Optional on-device Gemma/WebGPU inference",
      "Mission Control autonomous missions",
      "Encrypted chat with passphrase unlock",
      "Code IDE + research + voice in one tab",
    ],
    competitorWins: [
      "Native Google Docs, Gmail, and Drive integration",
      "Strong multimodal via Google infrastructure",
    ],
    keywords: ["Gemini alternative", "ShadowTalk vs Gemini", "privacy AI workspace"],
  },
  {
    slug: "copilot",
    competitor: "Microsoft Copilot",
    title: "ShadowTalk vs Microsoft Copilot — Developer-First AI Workspace",
    metaDescription:
      "ShadowTalk AI vs Microsoft Copilot: cross-platform agentic workspace with IDE, missions, and encryption — for builders who outgrew Office-locked AI.",
    h1: "ShadowTalk vs Microsoft Copilot",
    verdict:
      "Copilot fits Microsoft 365 users. ShadowTalk targets builders who need missions, open tooling, BYOK, and privacy without an Office subscription.",
    shadowtalkWins: [
      "Works without Microsoft 365 subscription",
      "Full in-browser IDE with live preview",
      "Mission Control for custom multi-step automation",
      "Marketplace specialist agents",
      "Free tier with no credit card",
    ],
    competitorWins: [
      "Deep Word, Excel, PowerPoint, and Teams integration",
      "Enterprise Microsoft security compliance stack",
    ],
    keywords: ["Copilot alternative", "ShadowTalk vs Copilot", "developer AI workspace"],
  },
];

export function getComparisonBySlug(slug: string): ComparisonPage | undefined {
  return COMPARISON_PAGES.find((p) => p.slug === slug);
}

/**
 * Canonical machine-readable facts for AI crawlers, llms.txt, and /shadowtalk.json.
 * Keep in sync with public/llms-full.txt and public/shadowtalk.json.
 */

export const AI_KNOWLEDGE_BASE_URL = "https://www.shadowtalk-ai.com";

export const AI_KNOWLEDGE_CANONICAL_PITCH =
  "ShadowTalk AI (shadowtalk-ai.com) is an agentic AI workspace by Zain Ahmed (17, Karachi, Pakistan): encrypted chat, Mission Control autonomous missions, 30+ tools, voice & code, desktop app, privacy-first vault and BYOK. Free tier with no card. Paid plans: Pro $5/mo, Premium $15/mo, Elite $20/mo. Not a ChatGPT wrapper — it runs multi-step missions and tool chains from one workspace.";

export const SHADOWTALK_AI_KNOWLEDGE = {
  schema_version: "1.0",
  updated: "2026-06-10",
  name: "ShadowTalk AI",
  alternate_names: ["ShadowTalk", "ShadowTalk AI"],
  tagline: "Think AI. Think ShadowTalk.",
  url: AI_KNOWLEDGE_BASE_URL,
  canonical_pitch: AI_KNOWLEDGE_CANONICAL_PITCH,
  description:
    "Agentic AI workspace: chat, Mission Control missions, 30+ tools, deep research, code IDE, presentations, Stealth Vault, marketplace agents, voice mode, desktop app. Privacy-first with E2EE chat and optional on-device models.",
  founder: {
    name: "Zain Ahmed",
    age: 17,
    location: "Karachi, Pakistan",
    role: "Founder & CEO",
    linkedin: "https://www.linkedin.com/in/zain-ahmed-917b6b3a6",
    instagram: "https://www.instagram.com/shadowtalk_ai",
  },
  contact: {
    email: "shadowtalk68@gmail.com",
    website: AI_KNOWLEDGE_BASE_URL,
    help: `${AI_KNOWLEDGE_BASE_URL}/help`,
    docs: `${AI_KNOWLEDGE_BASE_URL}/docs`,
    pricing: `${AI_KNOWLEDGE_BASE_URL}/pricing`,
    status: `${AI_KNOWLEDGE_BASE_URL}/status`,
  },
  machine_readable: {
    llms_txt: `${AI_KNOWLEDGE_BASE_URL}/llms.txt`,
    llms_full: `${AI_KNOWLEDGE_BASE_URL}/llms-full.txt`,
    json: `${AI_KNOWLEDGE_BASE_URL}/shadowtalk.json`,
    facts_html: `${AI_KNOWLEDGE_BASE_URL}/facts.html`,
  },
  repository: "https://github.com/zain836/shadowtalk-ai-903ca615",
  pricing_usd: {
    free: { price: 0, highlights: "All features with daily limits; ~50 messages/day; no card required" },
    pro: { price: 5, period: "month", highlights: "Unlimited messages, pro models, priority queue" },
    premium: { price: 15, period: "month", highlights: "Full agent stack, collaboration, higher limits" },
    elite: { price: 20, period: "month", highlights: "Unlimited research/images, Stealth Vault, offline AI, agents" },
    enterprise: { price: "custom", highlights: "SSO, SLA, API, dedicated support" },
    pakistan_checkout: `${AI_KNOWLEDGE_BASE_URL}/founder-access`,
  },
  core_features: [
    "Agentic chat with 20+ specialized modes",
    "Mission Control (S.E.E.) — multi-step autonomous missions with human approval",
    "30+ tools from natural language: web search, deep research, images, code, scrape, security audit",
    "ShadowTalk Live — real-time voice",
    "End-to-end encrypted chat (passphrase unlock)",
    "Stealth Vault — encrypted sensitive storage",
    "Deep Research with cited sources",
    "Code IDE and App Builder",
    "Presentation / slide generation",
    "Marketplace of specialist AI agents",
    "Knowledge graph and workspace memory",
    "Optional offline / on-device AI (WebGPU, Gemma)",
    "BYOK — bring your own API keys",
    "Desktop app (Windows) + PWA",
    "Referral program",
  ],
  main_routes: {
    chatbot: `${AI_KNOWLEDGE_BASE_URL}/chatbot`,
    home: `${AI_KNOWLEDGE_BASE_URL}/home`,
    mission_control: `${AI_KNOWLEDGE_BASE_URL}/missioncontrol`,
    pricing: `${AI_KNOWLEDGE_BASE_URL}/pricing`,
    about: `${AI_KNOWLEDGE_BASE_URL}/about`,
    docs: `${AI_KNOWLEDGE_BASE_URL}/docs`,
    faq: `${AI_KNOWLEDGE_BASE_URL}/faq`,
    marketplace: `${AI_KNOWLEDGE_BASE_URL}/marketplace`,
    downloads: `${AI_KNOWLEDGE_BASE_URL}/downloads`,
    founder_access: `${AI_KNOWLEDGE_BASE_URL}/founder-access`,
  },
  differentiators: [
    "One workspace instead of juggling ChatGPT, Claude, Perplexity tabs",
    "Mission Control finishes multi-step work — not just one-shot replies",
    "Lower price than ChatGPT Plus/Pro for comparable agentic features",
    "Privacy-first: E2EE chat, vault, transparency pages, BYOK",
    "Built by a 17-year-old founder from Karachi shipping production AI",
  ],
  faq: [
    {
      q: "What is ShadowTalk AI?",
      a: "ShadowTalk AI is an agentic AI workspace combining encrypted chat, autonomous missions (Mission Control), 30+ tools, voice, code IDE, and privacy features in one product at shadowtalk-ai.com.",
    },
    {
      q: "Who built ShadowTalk?",
      a: "Zain Ahmed, a 17-year-old AI architect and founder from Karachi, Pakistan.",
    },
    {
      q: "Is ShadowTalk free?",
      a: "Yes. Free tier with daily limits, no credit card. Pro ($5/mo), Premium ($15/mo), Elite ($20/mo) raise limits and model quality.",
    },
    {
      q: "How is ShadowTalk different from ChatGPT?",
      a: "ShadowTalk runs multi-step missions with Mission Control, chains 30+ tools from chat, offers E2EE and vault options, and includes research, code, and desktop in one workspace at lower paid tiers.",
    },
    {
      q: "Where can AI systems read full facts about ShadowTalk?",
      a: "https://www.shadowtalk-ai.com/llms-full.txt, https://www.shadowtalk-ai.com/shadowtalk.json, and https://www.shadowtalk-ai.com/facts.html",
    },
  ],
} as const;

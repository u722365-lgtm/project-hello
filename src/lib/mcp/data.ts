/** Public, intentionally shareable ShadowTalk product facts used by the MCP server. */

export type PlanInfo = {
  name: string;
  price: string;
  highlights: string[];
};

export const PRODUCT = {
  name: "ShadowTalk AI",
  tagline:
    "A sovereign agentic AI workspace: encrypted chat, Mission Control missions, 30+ tools, voice, code IDE, desktop app, and optional on-device models.",
  website: "https://www.shadowtalk-ai.com",
  founder: "Zain Ahmed Fahad Patel (Karachi, Pakistan)",
  freeTier:
    "Free tier with no credit card: 5,000 chat messages, 20 image generations, 20 document generations, 5 deep-research tasks.",
  privacy:
    "Privacy-first: client-side encryption for the Stealth Vault, local-first storage, optional offline models so normal chat can run fully on-device.",
};

export const PLANS: PlanInfo[] = [
  {
    name: "Free",
    price: "$0",
    highlights: [
      "5,000 chat messages",
      "20 image + 20 document generations",
      "5 deep-research tasks",
      "No credit card required",
    ],
  },
  {
    name: "Pro",
    price: "$5/month",
    highlights: ["Higher limits", "Priority routing", "Full tool suite"],
  },
  {
    name: "Premium",
    price: "$15/month",
    highlights: ["Mission Control automation", "Advanced research", "Creative Studio"],
  },
  {
    name: "Elite",
    price: "$20/month",
    highlights: ["Maximum limits", "Enterprise features", "Priority support"],
  },
];

export type FeatureInfo = {
  name: string;
  category: string;
  route: string;
  description: string;
};

export const FEATURES: FeatureInfo[] = [
  {
    name: "Agentic Chat",
    category: "chat",
    route: "/chatbot",
    description:
      "Multi-model agentic chat with tool orchestration, documents, images, voice input and code execution.",
  },
  {
    name: "Mission Control",
    category: "automation",
    route: "/execute",
    description:
      "Long-running autonomous missions with real web search, scraping and step-by-step execution logs.",
  },
  {
    name: "Deep Research",
    category: "research",
    route: "/deep-research",
    description: "Multi-step research with citations and selectable depth.",
  },
  {
    name: "Strategy Agent",
    category: "business",
    route: "/strategy-agent",
    description: "CEO-suite business strategy, 12-month simulations and hype/trend scouting.",
  },
  {
    name: "Personal IDE",
    category: "code",
    route: "/ide",
    description: "Monaco-based editor with AI code generation and an in-browser execution sandbox.",
  },
  {
    name: "Creative Studio",
    category: "media",
    route: "/studio",
    description: "AI media and document editor: images, audio, video and presentation building.",
  },
  {
    name: "Stealth Vault",
    category: "security",
    route: "/stealth-vault",
    description: "PBKDF2 + AES-256-GCM client-side encrypted vault with biometric (WebAuthn) unlock.",
  },
  {
    name: "Cyber Command Center",
    category: "security",
    route: "/cyber-command",
    description: "Security modules including URL scanning and vulnerability intelligence feeds.",
  },
  {
    name: "Knowledge Graph",
    category: "research",
    route: "/knowledge-graph",
    description: "Force-directed graph over your captured entities and research notes.",
  },
  {
    name: "Local Models",
    category: "privacy",
    route: "/personal-llm",
    description: "WebLLM and in-browser models so normal chat stays on your device.",
  },
  {
    name: "Marketplace",
    category: "ecosystem",
    route: "/marketplace",
    description: "Installable specialist agents that run inside chat, with an 80% revenue share for authors.",
  },
  {
    name: "Desktop App",
    category: "platform",
    route: "/download",
    description: "Cross-platform desktop build (Windows, macOS, Linux) with bundled offline runtime.",
  },
];

export const FAQS: { question: string; answer: string }[] = [
  {
    question: "Do I need an account to try ShadowTalk?",
    answer:
      "No. You can start chatting from the /chatbot workspace without signing up; an account keeps your history and unlocks higher limits.",
  },
  {
    question: "Is my data used for training?",
    answer:
      "No. ShadowTalk does not train on your conversations. Vault content is encrypted client-side, and normal chat can run on an on-device model.",
  },
  {
    question: "What does ShadowTalk cost?",
    answer:
      "There is a free tier with no credit card. Paid plans are Pro $5/month, Premium $15/month and Elite $20/month.",
  },
  {
    question: "Can I run it offline?",
    answer:
      "Yes. The browser app can download an in-browser model (WebLLM/WebGPU), so normal chat works without the cloud. The desktop app also supports local-first routing.",
  },
  {
    question: "Which platforms are supported?",
    answer: "Web (PWA), Windows, macOS, Linux desktop builds, plus mobile via the installable PWA.",
  },
];

import { FREE_TIER_MARKETING } from "@/lib/productClaims";

export interface DocRouteLink {
  path: string;
  label: string;
  desc: string;
  group?: string;
}

export interface DocStep {
  step: number;
  title: string;
  description: string;
}

export type DocFeatureIconKey =
  | "brain"
  | "zap"
  | "users"
  | "code"
  | "compass"
  | "search"
  | "shield"
  | "file"
  | "lock"
  | "wifi-off"
  | "key"
  | "message";

export interface DocFeatureItem {
  icon: DocFeatureIconKey;
  title: string;
  description: string;
  badge?: string;
}

export interface DocFaqItem {
  q: string;
  a: string;
}

export interface DocTroubleshootItem {
  issue: string;
  solutions: string[];
}

export interface DocWorkspaceTopic {
  title: string;
  items: string[];
}

export interface DocOverviewSection {
  title: string;
  paragraphs: string[];
}

export interface DocToolItem {
  name: string;
  trigger: string;
  description: string;
  plan?: string;
}

export interface DocPricingTier {
  name: string;
  price: string;
  tagline: string;
  highlights: string[];
}

export interface DocGlossaryItem {
  term: string;
  definition: string;
}

export interface DocMissionStep {
  step: number;
  title: string;
  description: string;
}

export const DOC_TAGLINE =
  "ShadowTalk is an elite, minimal agentic AI workspace focused entirely on three core pillars: Shadow DreamState, Omniscience, and Twin.";

export const DOC_OVERVIEW: DocOverviewSection[] = [
  {
    title: "What is ShadowTalk?",
    paragraphs: [
      "ShadowTalk is a highly-focused, next-generation AI workspace powered by OpenAI GPT-4o and Groq's Turbo Engine. We believe in doing a few things exceptionally well.",
      "Instead of cluttering the UI with endless hubs and marketplaces, we have stripped the application down to its three most powerful autonomous capabilities: Shadow DreamState, Shadow Omniscience, and Shadow Twin.",
    ],
  },
  {
    title: "The Big Three",
    paragraphs: [
      "1. Shadow DreamState: While you are away, your workspace continues to work. Autonomous agents run deep research, monitor data, and synthesize reports in the background.",
      "2. Shadow Omniscience: An AI that doesn't just answer questions, but understands your entire contextual footprint across files, previous chats, and connected knowledge bases.",
      "3. Shadow Twin: A hyper-personalized digital clone that learns your writing style, decision-making frameworks, and preferences to act on your behalf.",
    ],
  },
  {
    title: "Turbo Engine Architecture",
    paragraphs: [
      "ShadowTalk uses a proprietary Turbo Engine to intelligently route your prompts. High-complexity reasoning tasks are seamlessly routed to OpenAI's GPT-4o, while low-latency chat uses Groq's blazing fast Llama 3 models.",
    ],
  },
];

export const DOC_PRODUCT_PILLARS: DocFeatureItem[] = [
  {
    icon: "brain",
    title: "Shadow DreamState",
    description: "Autonomous background processing. Your AI works while you sleep, researching and synthesizing data for when you return.",
    badge: "Core",
  },
  {
    icon: "search",
    title: "Shadow Omniscience",
    description: "Total contextual awareness. The AI connects dots across all your uploaded documents, past conversations, and data silos.",
    badge: "Core",
  },
  {
    icon: "users",
    title: "Shadow Twin",
    description: "Your digital clone. An AI fine-tuned to your exact writing style, logic, and operational preferences.",
    badge: "Core",
  },
  {
    icon: "zap",
    title: "Turbo Engine",
    description: "Intelligent model routing between OpenAI (GPT-4o) and Groq (Llama-3) based on task complexity.",
    badge: "Engine",
  },
];

export const DOC_QUICK_START: DocStep[] = [
  {
    step: 1,
    title: "Open the workspace",
    description:
      "Go to shadowtalk-ai.com/chatbot. Anonymous sessions start automatically; link email from Profile to save history.",
  },
  {
    step: 2,
    title: "Use the composer",
    description:
      "Type your prompt. The Turbo Engine will automatically route it to OpenAI GPT-4o for complex tasks, or Groq for fast chatting.",
  },
  {
    step: 3,
    title: "Activate DreamState",
    description:
      "Ask the AI to monitor a topic or perform a long-running research task, then step away. The agent will execute autonomously in the background.",
  },
  {
    step: 4,
    title: "Configure your Twin",
    description:
      "Provide documents, past emails, and instructions to fine-tune your Shadow Twin. It will adopt your tone seamlessly.",
  },
];

export const DOC_ROUTES: DocRouteLink[] = [
  { path: "/", label: "Marketing home", desc: "Hero, features, pricing, use-case wedges", group: "Entry" },
  { path: "/chatbot", label: "AI workspace", desc: "Main product — streaming chat, DreamState, Omniscience, Twin", group: "Entry" },
  { path: "/auth", label: "Sign in", desc: "Authenticate to save history across devices", group: "Entry" },
  { path: "/docs", label: "Documentation", desc: "This page — product guides, FAQ", group: "Help" },
  { path: "/changelog", label: "Changelog", desc: "Release notes and shipped features", group: "Help" },
];

export const DOC_WORKSPACE_GUIDE: DocWorkspaceTopic[] = [
  {
    title: "Chat layout",
    items: [
      "Center — Messages and the core conversational interface.",
      "Bottom — The composer pill to send prompts.",
      "Intelligence Hub — Context about your Twin and Omniscience state.",
    ],
  },
  {
    title: "Providers & routing",
    items: [
      "The Turbo Engine uses AI heuristics to determine if your task requires GPT-4o's reasoning or Groq's speed.",
      "Routing is entirely automatic. Simply type your prompt.",
    ],
  },
];

export const DOC_FEATURES: DocFeatureItem[] = [
  {
    icon: "brain",
    title: "Shadow DreamState",
    description: "Asynchronous agent execution.",
    badge: "Core",
  },
  {
    icon: "search",
    title: "Shadow Omniscience",
    description: "Deep contextual integration.",
    badge: "Core",
  },
  {
    icon: "users",
    title: "Shadow Twin",
    description: "Hyper-personalized digital clone.",
    badge: "Core",
  },
];

export const DOC_TOOLS: DocToolItem[] = [
  {
    name: "Omniscience Indexing",
    trigger: "Upload file or paste link",
    description: "Automatically indexes data for the Omniscience engine.",
  }
];

export const DOC_MISSION_CONTROL: DocMissionStep[] = [
  {
    step: 1,
    title: "Initiate DreamState",
    description: "Command the AI to perform a background task.",
  },
  {
    step: 2,
    title: "Autonomous execution",
    description: "The AI plans and executes the task using Turbo Engine.",
  },
  {
    step: 3,
    title: "Review results",
    description: "View the synthesized report upon your return.",
  }
];

export const DOC_PRIVACY_SECTIONS: DocWorkspaceTopic[] = [
  {
    title: "Data Security",
    items: [
      "Your API keys (OpenAI, Groq) remain securely stored in your local .env or client-side storage.",
      "We do not train on your chats.",
    ],
  }
];

export const DOC_PRICING_TIERS: DocPricingTier[] = [
  {
    name: "Free",
    price: "$0",
    tagline: "Experience the Big Three",
    highlights: ["Basic DreamState", "Turbo Engine Standard", "1 Twin Profile"],
  },
  {
    name: "Elite",
    price: "$20/mo",
    tagline: "Full Autonomous Power",
    highlights: ["Unlimited DreamState", "GPT-4o Priority", "Unlimited Twin Profiles"],
  }
];

export const DOC_DESKTOP: DocWorkspaceTopic[] = [
  {
    title: "PWA Support",
    items: [
      "Install ShadowTalk as a PWA from your browser to get a native desktop experience.",
    ],
  }
];

export const DOC_GLOSSARY: DocGlossaryItem[] = [
  {
    term: "Turbo Engine",
    definition: "The core intelligence router that switches between OpenAI and Groq.",
  },
  {
    term: "DreamState",
    definition: "Background asynchronous task execution.",
  },
  {
    term: "Omniscience",
    definition: "Total workspace contextual awareness.",
  },
  {
    term: "Twin",
    definition: "Personalized digital clone.",
  }
];

export const DOC_FAQ: DocFaqItem[] = [
  {
    q: "What is ShadowTalk?",
    a: "ShadowTalk is an agentic AI workspace focused on DreamState, Omniscience, and Twin capabilities.",
  },
  {
    q: "How do I use it?",
    a: "Simply navigate to /chatbot and type your prompt. The Turbo Engine will handle the rest.",
  },
  {
    q: "What models are used?",
    a: "ShadowTalk intelligently routes between OpenAI GPT-4o and Groq Llama-3 depending on task complexity.",
  }
];

export const DOC_TROUBLESHOOTING: DocTroubleshootItem[] = [
  {
    issue: "Messages not sending",
    solutions: [
      "Check your internet connection.",
      "Ensure your VITE_OPENAI_API_KEY and VITE_GROQ_API_KEY are properly configured.",
    ],
  }
];

export function docSearchBlob(parts: {
  features: DocFeatureItem[];
  faq: DocFaqItem[];
  troubleshooting: DocTroubleshootItem[];
  workspace: DocWorkspaceTopic[];
  overview?: DocOverviewSection[];
  tools?: DocToolItem[];
  privacy?: DocWorkspaceTopic[];
  glossary?: DocGlossaryItem[];
}): string {
  return [
    DOC_TAGLINE,
    ...DOC_QUICK_START.map((s) => `${s.title} ${s.description}`),
    ...DOC_ROUTES.map((r) => `${r.path} ${r.label} ${r.desc}`),
    ...(parts.overview ?? DOC_OVERVIEW).flatMap((o) => [o.title, ...o.paragraphs]),
    ...(parts.tools ?? DOC_TOOLS).map((t) => `${t.name} ${t.trigger} ${t.description}`),
    ...(parts.privacy ?? DOC_PRIVACY_SECTIONS).flatMap((p) => [p.title, ...p.items]),
    ...(parts.glossary ?? DOC_GLOSSARY).map((g) => `${g.term} ${g.definition}`),
    ...DOC_MISSION_CONTROL.map((m) => `${m.title} ${m.description}`),
    ...DOC_PRICING_TIERS.flatMap((p) => [p.name, p.tagline, ...p.highlights]),
    ...parts.features.map((f) => `${f.title} ${f.description}`),
    ...parts.faq.map((f) => `${f.q} ${f.a}`),
    ...parts.troubleshooting.map((t) => `${t.issue} ${t.solutions.join(" ")}`),
    ...parts.workspace.map((w) => `${w.title} ${w.items.join(" ")}`),
  ].join(" ").toLowerCase();
}

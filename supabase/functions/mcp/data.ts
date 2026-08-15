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
    description: "Ollama and in-browser models so normal chat stays on your device.",
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
      "Yes. The desktop app bundles a local runtime (Ollama) and the browser app can download an in-browser model, so normal chat works without the cloud.",
  },
  {
    question: "Which platforms are supported?",
    answer: "Web (PWA), Windows, macOS, Linux desktop builds, plus mobile via the installable PWA.",
  },
];

export type ChangelogChange = { type: string; text: string };
export interface ProductChangelogEntry { version: string; title: string; summary: string; publishedAt: string; changes: ChangelogChange[]; tags?: string[]; }
export const PRODUCT_CHANGELOG: ProductChangelogEntry[] = [
  {
    version: "2.6.0",
    title: "Workspace-first experience",
    summary: "Open ShadowTalk straight into chat — faster entry, persistent sessions, cleaner composer.",
    publishedAt: "2026-06-01",
    tags: ["UX", "Auth", "Chat"],
    changes: [
      { type: "feature", text: "Site root (/) now opens the /chatbot workspace; marketing lives at /home." },
      { type: "feature", text: "Persistent sessions — return visits stay signed in; optional anonymous auto sign-in (Gemini-style)." },
      { type: "improvement", text: "Removed boot splash and “Warming up…” screen on the chatbot path." },
      { type: "improvement", text: "Chat composer: send button aligned inside the pill; Turbo hardware badge removed from UI." },
      { type: "improvement", text: "Dedicated /pricing page with animated plan comparison." },
      { type: "improvement", text: "Marketing landing uses neural dock navigation (Pricing, Install, Login)." },
      { type: "bugfix", text: "Fixed coupon banner runtime error and header overlap on home." },
    ],
  },
  {
    version: "2.5.0",
    title: "App Builder & runnable Marketplace",
    summary: "Generate full web/mobile projects in the IDE; install agents that actually run in chat.",
    publishedAt: "2026-05-30",
    tags: ["IDE", "Marketplace"],
    changes: [
      { type: "feature", text: "App Builder — “build me an app” creates multi-file projects and opens /ide with live preview." },
      { type: "feature", text: "Marketplace agents inject real system prompts, starters, and IDE scripts from /chatbot?agent=." },
      { type: "improvement", text: "Personal IDE: multi-file explorer, mobile viewport, templates, AI assist actions." },
    ],
  },
  {
    version: "2.4.0",
    title: "Hardware-aware speed paths",
    summary: "Automatic local WebGPU/WASM vs cloud routing on capable devices.",
    publishedAt: "2026-05-28",
    tags: ["Performance", "Offline"],
    changes: [
      { type: "feature", text: "Hardware intelligence scores CPU/GPU and caches profile for routing decisions." },
      { type: "feature", text: "Hybrid router sends simple messages to on-device models when ready." },
      { type: "improvement", text: "WebGPU prewarm runs in background without blocking chat input." },
      { type: "improvement", text: "Startup performance — deferred chrome, shared platform metrics, lazy landing sections." },
    ],
  },
  {
    version: "2.3.0",
    title: "BYOK & agentic tools",
    summary: "Bring your own API keys; Mission Control and expanded chat tooling.",
    publishedAt: "2026-05-20",
    tags: ["BYOK", "Agents"],
    changes: [
      { type: "feature", text: "BYOK for Gemini and Kimi — keys in Profile/Settings." },
      { type: "feature", text: "Mission Control (/missioncontrol) for multi-step autonomous workflows." },
      { type: "feature", text: "Command palette (⌘K) for quick navigation and tool launch." },
      { type: "improvement", text: "Tool orchestration with human-in-the-loop confirmations on sensitive actions." },
    ],
  },
  {
    version: "2.2.0",
    title: "Foundation release",
    summary: "Desktop app, trust metrics, brand refresh, and agentic chat loop.",
    publishedAt: "2026-05-10",
    tags: ["Desktop", "Trust"],
    changes: [
      { type: "feature", text: "Electron desktop builds with native file picker and notifications." },
      { type: "feature", text: "Cyber Command Center — security copilot, scans, and ops modules." },
      { type: "improvement", text: "Honest product claims and live community metrics on landing." },
      { type: "security", text: "Security hardening migrations and stealth network guard options." },
    ],
  },
];

export function mergeChangelogWithCms(
  cmsEntries: Array<{
    id?: string;
    version: string;
    title: string;
    description: string;
    change_type: string;
    tags?: string[] | null;
    published_at?: string | null;
  }>,
): Array<ProductChangelogEntry & { id?: string }> {
  const staticVersions = new Set(PRODUCT_CHANGELOG.map((e) => e.version));

  const fromCms: Array<ProductChangelogEntry & { id?: string }> = cmsEntries
    .filter((e) => !staticVersions.has(e.version))
    .map((e) => ({
      id: e.id,
      version: e.version,
      title: e.title,
      summary: e.description,
      publishedAt: e.published_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      tags: (e.tags as string[]) ?? [],
      changes: [
        {
          type: (e.change_type as ChangelogChangeType) || "improvement",
          text: e.description,
        },
      ],
    }));

  return [...PRODUCT_CHANGELOG, ...fromCms].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

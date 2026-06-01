export interface DocRouteLink {
  path: string;
  label: string;
  desc: string;
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

export const DOC_TAGLINE =
  "ShadowTalk is an agentic AI workspace — chat, tools, missions, code, and research in one place.";

export const DOC_QUICK_START: DocStep[] = [
  {
    step: 1,
    title: "Open the workspace",
    description:
      "Go to shadowtalk-ai.com — you land on /chatbot immediately. No boot screen. A session starts automatically; link email anytime from Profile.",
  },
  {
    step: 2,
    title: "Use the composer",
    description:
      "Type in the pill at the bottom. Attach files (+), pick a provider (Sovereign or BYOK), use voice (mic), and Send (or Enter). Shift+Enter adds a new line.",
  },
  {
    step: 3,
    title: "Open tools & missions",
    description:
      "Header: Settings, New chat, History, Clear. Sidebar: Intelligence, IDE, Marketplace, Mission Control. Tools menu (⊞) for image gen, research, browser, and more.",
  },
  {
    step: 4,
    title: "Upgrade when you need more",
    description:
      "Visit /pricing for Pro, Premium, or Elite — unlimited messages, images, vault, offline models, collaborative rooms, and API access.",
  },
];

export const DOC_ROUTES: DocRouteLink[] = [
  { path: "/chatbot", label: "Workspace (default)", desc: "Main AI chat — site root redirects here" },
  { path: "/home", label: "Marketing", desc: "Landing page, features, pricing overview" },
  { path: "/pricing", label: "Pricing", desc: "Plans, billing toggle, upgrade" },
  { path: "/missioncontrol", label: "Mission Control", desc: "Multi-step autonomous missions" },
  { path: "/marketplace", label: "Marketplace", desc: "Install and run specialist agents" },
  { path: "/ide", label: "IDE", desc: "Code editor and App Builder output" },
  { path: "/settings", label: "Settings", desc: "Chat defaults, offline AI, API keys" },
  { path: "/vault", label: "Stealth Vault", desc: "Encrypted sensitive storage (Elite)" },
  { path: "/cyber", label: "Cyber Command", desc: "Security operations center" },
  { path: "/changelog", label: "Changelog", desc: "Release notes and shipped features" },
];

export const DOC_WORKSPACE_GUIDE: DocWorkspaceTopic[] = [
  {
    title: "Chat layout",
    items: [
      "Left rail — quick nav (Chat, Explore links, Shadow Mode toggle, profile).",
      "Center — messages, empty-state prompts, or active thread.",
      "Bottom — composer pill: attach, text, provider chip, voice, send.",
      "History panel — past conversations (archive supported).",
    ],
  },
  {
    title: "Sign-in & sessions",
    items: [
      "First visit can use an automatic anonymous session (enable in Supabase Auth).",
      "Sign out is remembered — you won’t be silently re-logged in until you sign in again.",
      "Link email/OAuth from Profile to keep history across devices.",
      "BYOK keys live in Settings — Sovereign uses platform routing when no custom key is set.",
    ],
  },
  {
    title: "Providers & speed",
    items: [
      "Sovereign — default platform routing to the best available model.",
      "BYOK — Gemini, OpenRouter, Kimi when you add verified keys.",
      "Offline — install SmolLM (~130MB) or Gemma in Settings → Offline AI; routing picks local vs cloud automatically.",
      "No Turbo badge in the UI — speed path is automatic based on your hardware.",
    ],
  },
  {
    title: "High-value flows",
    items: [
      "“Build a fitness app” → App Builder opens /ide with HTML/CSS/JS preview.",
      "Marketplace → Run agent → /chatbot?agent=id with specialist behavior.",
      "Deep research, image gen, ShadowBrowser — from Tools menu or command palette (⌘K).",
      "Export chat — toolbar actions when a conversation has messages.",
    ],
  },
];

export const DOC_FEATURES: DocFeatureItem[] = [
  {
    icon: "message",
    title: "AI Chat Workspace",
    description: "Streaming chat, personalities, 30+ tools, file uploads, and conversation history.",
    badge: "Core",
  },
  {
    icon: "zap",
    title: "Mission Control",
    description: "Autonomous multi-step missions with approval gates when tools need confirmation.",
    badge: "Pro+",
  },
  {
    icon: "users",
    title: "Marketplace Agents",
    description: "Install specialists — legal, code, research — with real prompts injected in chat.",
    badge: "Core",
  },
  {
    icon: "code",
    title: "Personal IDE & App Builder",
    description: "Monaco editor, multi-file projects, live preview, mobile viewport — from chat or /ide.",
    badge: "Core",
  },
  {
    icon: "compass",
    title: "ShadowBrowser",
    description: "AI-assisted browsing with summaries and Browse Together mode.",
    badge: "Free",
  },
  {
    icon: "search",
    title: "Deep Research",
    description: "Multi-step research with citations — from chat tools and /research.",
    badge: "Pro+",
  },
  {
    icon: "shield",
    title: "Cyber Command",
    description: "Security copilot, scans, threat intel, and ops modules at /cyber.",
    badge: "New",
  },
  {
    icon: "file",
    title: "Presentation Builder",
    description: "Generate slide decks from a prompt at /presentations.",
    badge: "Pro+",
  },
  {
    icon: "lock",
    title: "Stealth Vault",
    description: "Encrypted storage for sensitive notes and documents (Elite).",
    badge: "Elite",
  },
  {
    icon: "wifi-off",
    title: "Offline AI",
    description: "On-device SmolLM and optional Gemma via WebGPU when hardware allows.",
    badge: "Elite",
  },
  {
    icon: "key",
    title: "BYOK",
    description: "Use your Gemini, OpenRouter, or Kimi keys — billed by your provider.",
    badge: "Settings",
  },
  {
    icon: "users",
    title: "Collaborative Rooms",
    description: "Real-time multi-user AI rooms at /rooms (Pro+).",
    badge: "Pro+",
  },
];

export const DOC_FAQ: DocFaqItem[] = [
  {
    q: "Where do I start?",
    a: "Open shadowtalk-ai.com — you’ll land on /chatbot. No account required for the first session if anonymous sign-in is enabled. Link an email from Profile to save history.",
  },
  {
    q: "What’s the difference between /home and /chatbot?",
    a: "/chatbot is the product workspace. /home is the marketing site (features, pricing overview, install links).",
  },
  {
    q: "Why don’t I see a boot or loading screen?",
    a: "We removed the full-screen boot and “Warming up…” gate on the workspace path so you can start typing immediately while the session restores.",
  },
  {
    q: "What AI models does ShadowTalk use?",
    a: "Sovereign routing uses platform models (e.g. Gemini family via our gateway). With BYOK you can point chat at your own Gemini, OpenRouter, or Kimi keys. Offline mode uses on-device SmolLM or Gemma when installed.",
  },
  {
    q: "How do I add my own API key?",
    a: "Go to Settings or Profile → API keys. Choose a provider, paste your key, verify, then select that provider in the chat composer chip.",
  },
  {
    q: "What is Mission Control?",
    a: "A multi-step agent runner at /missioncontrol — it plans tasks, calls tools, and can pause for your approval on sensitive actions.",
  },
  {
    q: "How does offline mode work?",
    a: "Install a local model from Settings → Offline AI (SmolLM ~130MB or larger Gemma). When offline or when routing chooses local, replies run in your browser via WebGPU/WASM.",
  },
  {
    q: "Is my data private?",
    a: "We don’t train on your chats. BYOK sends prompts to your provider. Stealth Vault and local inference keep sensitive work on-device when you use those features. See /privacy and /transparency.",
  },
];

export const DOC_TROUBLESHOOTING: DocTroubleshootItem[] = [
  {
    issue: "Messages not sending",
    solutions: [
      "Check internet connection and refresh /chatbot.",
      "Open Settings — confirm Sovereign or a verified BYOK key.",
      "Free tier: check daily message limit; upgrade at /pricing if needed.",
    ],
  },
  {
    issue: "Stuck on loading or old boot screen",
    solutions: [
      "Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac).",
      "Open /chatbot directly — workspace should load without a splash.",
      "Clear site cache; redeploy may be pending on your host.",
    ],
  },
  {
    issue: "Session not persisting",
    solutions: [
      "Don’t use private browsing if you want stay signed in.",
      "If you signed out explicitly, sign in again from /auth.",
      "Allow cookies/local storage for the site.",
    ],
  },
  {
    issue: "Voice input not working",
    solutions: [
      "Allow microphone permission in the browser.",
      "Use Chrome or Edge for best WebRTC support.",
      "Click the mic in the composer or open ShadowTalk Live from tools.",
    ],
  },
  {
    issue: "Offline model won’t load",
    solutions: [
      "Use a Chromium browser with WebGPU support.",
      "Install SmolLM first (~130MB) before Gemma.",
      "Profile → Offline AI — check download status and storage quota.",
    ],
  },
  {
    issue: "Marketplace agent not activating",
    solutions: [
      "Click Run on the agent card — URL should include ?agent=.",
      "Refresh /chatbot after install.",
      "Check network; agent config may need a fresh deploy if DB migration pending.",
    ],
  },
];

/** Lowercase blob for client-side search across docs tabs */
export function docSearchBlob(parts: {
  features: DocFeatureItem[];
  faq: DocFaqItem[];
  troubleshooting: DocTroubleshootItem[];
  workspace: DocWorkspaceTopic[];
}): string {
  return [
    DOC_TAGLINE,
    ...DOC_QUICK_START.map((s) => `${s.title} ${s.description}`),
    ...DOC_ROUTES.map((r) => `${r.path} ${r.label} ${r.desc}`),
    ...parts.features.map((f) => `${f.title} ${f.description}`),
    ...parts.faq.map((f) => `${f.q} ${f.a}`),
    ...parts.troubleshooting.map((t) => `${t.issue} ${t.solutions.join(" ")}`),
    ...parts.workspace.map((w) => `${w.title} ${w.items.join(" ")}`),
  ].join(" ").toLowerCase();
}

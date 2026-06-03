/**
 * ShadowTalk brand system — one voice everywhere (marketing, chat, SEO, product).
 * Keep claims honest; lead with what we actually ship.
 */

export const BRAND = {
  name: "ShadowTalk",
  fullName: "ShadowTalk AI",
  domain: "shadowtalk-ai.com",
  founder: "Zain",
  /** Memorable mnemonic — use consistently */
  mnemonic: "Think AI. Think ShadowTalk.",
  tagline: "The agentic AI workspace that finishes your work.",
  shortPitch:
    "Plan it. Run it. Ship it. One workspace for agents, 30+ tools, and privacy when stakes are high.",
  manifesto:
    "AI should execute — not just chat. ShadowTalk turns goals into missions, chains tools, and keeps you in control at every step.",
  /** Landing hero — bold, memorable, still honest about what we ship */
  heroHeadline: ["Stop Chatting.", "Start Shipping."],
  heroSubtitle:
    "ShadowTalk is the agentic workspace: Mission Control, 30+ tools, multi-step agents, and deliverables you can hand off — free to try, no card required.",
  heroBadge: "Free to try · Honest limits · Proof in our docs",
} as const;

/** Section headlines & subcopy for the home page */
export const LANDING_COPY = {
  manifesto: {
    kicker: BRAND.mnemonic,
    title: ["Generic chat is cheap.", "Execution is ShadowTalk."],
    body: "One workspace runs research, code, vault, voice, and autonomous missions — so you stop copying outputs between five tabs. Try it free; verify features in our docs and changelog.",
    traction: "Join builders who replaced “another chat tab” with a workspace that ships.",
  },
  comparison: {
    badge: "Feature-for-feature, honest",
    title: ["They reply.", "We run the playbook."],
    subtitle:
      "Side-by-side on agents, tools, privacy, and price — sourced from our docs, not hype. Confirm competitor pricing on their sites before you switch.",
  },
  features: {
    badge: "What you actually get",
    title: ["One workspace.", "Thirty-plus tools."],
    subtitle:
      "Mission Control, marketplace agents, IDE, research, presentations, Stealth Vault, BYOK, and optional on-device models — listed in /docs, shipped in product.",
  },
  pricing: {
    badge: "Transparent tiers",
    title: ["Unlimited execution.", "Without surprise fees."],
    subtitle:
      "Free to prove the workspace. Pro, Premium, and Elite when you're ready — cancel anytime, money-back guarantee, data practices stated before you pay.",
  },
  testimonials: {
    badge: "How early users work",
    title: ["No fake quotes.", "Real workflows."],
    subtitle:
      "Founder-led product: try the free tier, read the changelog, send feedback — we publish what ships instead of invented testimonials.",
  },
  community: {
    badge: "Live product, live metrics",
    title: ["Build in public", "with us."],
    subtitle:
      "Community numbers come from real workspace activity when available — plus public status, roadmap in changelog, and direct founder feedback.",
  },
  faq: {
    badge: "Straight answers",
    title: ["Know the product", "before you pay."],
    subtitle:
      "Limits, billing, privacy, and integrations — answered here and in /docs so you can choose ShadowTalk with confidence.",
  },
  founder: {
    line: "Crafted by a founder obsessed with agentic AI that actually ships — not slide decks.",
  },
} as const;

/** Real traction — sync with productClaims COMMUNITY_METRICS */
export const BRAND_TRACTION = {
  usersLabel: "1.5K+ creators",
  dailyLabel: "104+ daily active",
} as const;

export const BRAND_PILLARS = [
  {
    title: "Agents that finish",
    description: "Multi-step missions with Mission Control — not one-shot replies.",
    emoji: "🎯",
  },
  {
    title: "30+ tools, one sentence",
    description: "Research, code, vault, voice, docs — triggered from natural language.",
    emoji: "⚡",
  },
  {
    title: "You approve the edge",
    description: "Human-in-the-loop when stakes are high. Auto-run when you trust the flow.",
    emoji: "🛡️",
  },
  {
    title: "Privacy on your terms",
    description: "Cloud power by default. Vault, BYOK, and on-device Gemma when it matters.",
    emoji: "🔒",
  },
  {
    title: "Every surface",
    description: "Web, PWA, and desktop software — same brain, deeper device access on install.",
    emoji: "🖥️",
  },
] as const;

/** Rotating hero / chat hooks — memorable, specific */
export const BRAND_HOOKS = [
  "Try chat free — see agents and tools in one workspace.",
  "Mission Control runs multi-step work while you stay in the loop.",
  "30+ tools from one prompt — research, code, vault, voice.",
  "ChatGPT talks. ShadowTalk ships deliverables.",
  "Premium matches ChatGPT Plus pricing — with more execution built in.",
  "Proof in /changelog and /docs — not marketing fluff.",
  "Think AI. Think ShadowTalk.",
] as const;

export const CHAT_WELCOME_LINES = [
  "Think AI. Think ShadowTalk. What are we building today?",
  "Your agentic workspace is live. Give me a goal — I'll plan the steps.",
  "Mission-ready. Drop a task, research question, or 'run this for me'.",
  "Encrypted vault unlocked. Let's turn intent into output.",
] as const;

export const CHAT_EMPTY_HEADLINE = "What should ShadowTalk execute for you?";

export function pickBrandHook(seed?: number): string {
  const i = seed ?? Math.floor(Math.random() * BRAND_HOOKS.length);
  return BRAND_HOOKS[i % BRAND_HOOKS.length];
}

export function pickChatWelcome(seed?: number): string {
  const i = seed ?? Math.floor(Math.random() * CHAT_WELCOME_LINES.length);
  return CHAT_WELCOME_LINES[i % CHAT_WELCOME_LINES.length];
}

export type ChangelogChangeType = "feature" | "improvement" | "bugfix" | "security";

export interface ChangelogChange {
  type: ChangelogChangeType;
  text: string;
}

export interface ProductChangelogEntry {
  version: string;
  title: string;
  summary: string;
  publishedAt: string;
  changes: ChangelogChange[];
  tags?: string[];
}

/** Built-in release notes — shown on /changelog (merged with CMS entries). */
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
      { type: "feature", text: "BYOK for Gemini, , and Kimi — keys in Profile/Settings." },
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

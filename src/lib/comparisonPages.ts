export interface ComparisonPageData {
  slug: string;
  competitor: string;
  title: string;
  description: string;
  canonical: string;
  summary: string;
  bestFor: string;
  whyShadowTalkWins: string[];
  faq: Array<{ question: string; answer: string }>;
  rows: Array<{
    category: string;
    shadowtalk: string;
    competitor: string;
  }>;
}

export const COMPARISON_PAGES: ComparisonPageData[] = [
  {
    slug: "chatgpt",
    competitor: "ChatGPT",
    title: "ShadowTalk AI vs ChatGPT",
    description:
      "Compare ShadowTalk AI vs ChatGPT for agentic workflows, privacy, offline mode, multi-tool execution, and pricing.",
    canonical: "https://www.shadowtalk-ai.com/compare/chatgpt",
    summary:
      "ChatGPT is strong for general chat. ShadowTalk AI is built for buyers who want one workspace for missions, tools, research, privacy controls, and optional offline execution.",
    bestFor:
      "Teams and builders who want an AI workspace that can finish multi-step work instead of only answering one prompt at a time.",
    whyShadowTalkWins: [
      "Mission Control runs autonomous multi-step workflows with human oversight.",
      "30+ built-in tools reduce context switching across chat, research, code, and documents.",
      "Optional offline and device-first modes support privacy-sensitive work.",
      "Lower entry pricing for users who need an operational workspace, not just a chatbot.",
    ],
    faq: [
      {
        question: "How is ShadowTalk AI different from ChatGPT?",
        answer:
          "ShadowTalk AI focuses on agentic execution: missions, built-in tools, research flows, privacy controls, and optional offline mode. ChatGPT is excellent for general-purpose chat, but ShadowTalk is designed as an operational workspace.",
      },
      {
        question: "Is ShadowTalk AI cheaper than ChatGPT?",
        answer:
          "ShadowTalk offers a free tier with no card and lower paid entry points for users who want multi-tool workflows, privacy features, and autonomous missions in one product.",
      },
    ],
    rows: [
      { category: "Autonomous missions", shadowtalk: "Built-in Mission Control", competitor: "Primarily prompt-response chat" },
      { category: "Tooling", shadowtalk: "30+ tools in one workspace", competitor: "Tooling varies by plan and workflow" },
      { category: "Privacy controls", shadowtalk: "E2EE options, BYOK, vault, offline mode", competitor: "Mostly cloud-first" },
      { category: "Offline capability", shadowtalk: "Optional on-device models", competitor: "No primary offline workflow" },
      { category: "Best fit", shadowtalk: "Execution-heavy workflows", competitor: "General chat and writing" },
    ],
  },
  {
    slug: "claude",
    competitor: "Claude",
    title: "ShadowTalk AI vs Claude",
    description:
      "Compare ShadowTalk AI vs Claude for research, long-context work, privacy posture, missions, and product breadth.",
    canonical: "https://www.shadowtalk-ai.com/compare/claude",
    summary:
      "Claude is excellent for writing and long-context reasoning. ShadowTalk AI adds the surrounding operating system: missions, built-in tools, memory, privacy modules, and optional offline local models.",
    bestFor:
      "Operators who love strong reasoning but need their AI to act across tools, documents, and repeatable workflows.",
    whyShadowTalkWins: [
      "Combines reasoning with execution so users can move from insight to action in one interface.",
      "Includes developer tools, presentations, research, and voice inside the same product.",
      "Adds enterprise-style privacy posture with vault, BYOK, and local/offline options.",
      "Creates a deeper technical footprint for procurement and search-agent research via docs, facts, and architecture pages.",
    ],
    faq: [
      {
        question: "Is ShadowTalk AI better than Claude for writing?",
        answer:
          "Claude remains strong for writing-heavy tasks. ShadowTalk AI is better when the user needs writing plus execution, research, tools, privacy workflows, and autonomous follow-through.",
      },
      {
        question: "Why would a team choose ShadowTalk AI over Claude?",
        answer:
          "Teams choose ShadowTalk when they want one workspace for research, code, missions, voice, privacy controls, and optional offline usage instead of a standalone conversational model experience.",
      },
    ],
    rows: [
      { category: "Long-context reasoning", shadowtalk: "Strong with workspace context", competitor: "Very strong" },
      { category: "Execution layer", shadowtalk: "Mission Control + tool chains", competitor: "Limited product-native execution" },
      { category: "Developer workspace", shadowtalk: "IDE, tools, docs, API pages", competitor: "Less workspace breadth" },
      { category: "Privacy posture", shadowtalk: "Vault, BYOK, local options", competitor: "Cloud-first" },
      { category: "Best fit", shadowtalk: "Research + execution teams", competitor: "Writing and reasoning-first teams" },
    ],
  },
  {
    slug: "perplexity",
    competitor: "Perplexity",
    title: "ShadowTalk AI vs Perplexity",
    description:
      "Compare ShadowTalk AI vs Perplexity for research depth, citations, actionability, privacy, and multi-step execution.",
    canonical: "https://www.shadowtalk-ai.com/compare/perplexity",
    summary:
      "Perplexity is strong for fast answer retrieval. ShadowTalk AI goes further by turning research into action with autonomous missions, tool execution, code, and internal workspace memory.",
    bestFor:
      "Buyers who need cited research plus follow-through: briefs, documents, workflows, presentations, and ongoing memory in one place.",
    whyShadowTalkWins: [
      "Deep research can flow directly into missions, reports, presentations, and code.",
      "Users get a persistent workspace instead of a search-first answer layer only.",
      "ShadowTalk supports sensitive workflows with privacy-first and local-first paths.",
      "The product surface is broader for B2B evaluations: API, docs, security, compliance, and architecture pages.",
    ],
    faq: [
      {
        question: "Is ShadowTalk AI a search engine like Perplexity?",
        answer:
          "ShadowTalk AI includes deep research and cited outputs, but it is broader than a search product. It is an AI workspace for research, execution, documents, code, memory, and automation.",
      },
      {
        question: "When should I choose ShadowTalk AI over Perplexity?",
        answer:
          "Choose ShadowTalk when you want research plus action: follow-up tasks, reports, code, presentations, collaboration, and privacy controls in one stack.",
      },
    ],
    rows: [
      { category: "Research answers", shadowtalk: "Deep research with next-step execution", competitor: "Fast cited answer engine" },
      { category: "Workspace memory", shadowtalk: "Persistent knowledge + hubs", competitor: "Limited workspace model" },
      { category: "Actionability", shadowtalk: "Missions, tools, docs, code", competitor: "Primarily answer retrieval" },
      { category: "Offline/privacy options", shadowtalk: "Optional local workflows", competitor: "Cloud-first" },
      { category: "Best fit", shadowtalk: "Research-to-action workflows", competitor: "Search-first discovery" },
    ],
  },
];

export const COMPARISON_PAGE_BY_SLUG = Object.fromEntries(
  COMPARISON_PAGES.map((page) => [page.slug, page]),
) as Record<string, ComparisonPageData>;

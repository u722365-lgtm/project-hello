/**
 * Local prompt autocomplete engine.
 *
 * Runs fully on-device (no network, no cost) so it works for anonymous
 * visitors, logged-in users and offline/Bunker mode alike.
 * Suggests the most likely continuation of what the user is typing.
 */

const HISTORY_KEY = "shadowtalk_prompt_history";
const HISTORY_LIMIT = 60;

/** Common high-intent prompt templates used to complete a partial input. */
const PROMPT_CORPUS: string[] = [
  "Write a professional email to a client about a project delay",
  "Write a LinkedIn post about launching my new product",
  "Write a cold outreach message that gets replies",
  "Write a blog post outline about AI privacy",
  "Write a product description for my online store",
  "Summarize this document into key bullet points",
  "Summarize this article in plain English",
  "Explain this code and suggest improvements",
  "Explain quantum computing like I am five",
  "Explain the difference between revenue and profit",
  "Create a 30 day marketing plan for a startup",
  "Create a business plan for a small business in Pakistan",
  "Create a pitch deck outline for investors",
  "Create a weekly content calendar for Instagram",
  "Create a landing page copy that converts",
  "Generate an image of a futuristic city at night",
  "Generate 10 catchy names for my brand",
  "Generate unit tests for this function",
  "Help me prepare for a job interview as a software engineer",
  "Help me write a resume summary for my profile",
  "Help me plan a budget for the next three months",
  "Help me debug this error in my React app",
  "Analyze my competitors and find a market gap",
  "Analyze this data and highlight the key trends",
  "Translate this text into Urdu and keep the tone natural",
  "Rewrite this paragraph so it sounds more professional",
  "Rewrite this message to be shorter and friendlier",
  "Give me a step by step guide to start freelancing",
  "Give me 5 content ideas for my YouTube channel",
  "Build a simple landing page with HTML and Tailwind",
  "Build a strategy to get my first 100 customers",
  "Research the latest trends in artificial intelligence",
  "Research the best pricing model for a SaaS product",
  "Compare ShadowTalk with ChatGPT for privacy",
  "What are the best ways to grow a startup with no budget",
  "What should I focus on this week to hit my goals",
  "How do I improve the SEO of my website",
  "How do I keep my chats private while using AI",
  "Draft a proposal for a new client project",
  "Draft a polite follow up message after no reply",
  "Make a checklist for launching a new product",
  "Make a study plan for my exams",
  "Turn these notes into a clean report",
  "Turn this idea into a one page business case",
];

/** Frequent next-word continuations for very short inputs. */
const STARTER_HINTS: Record<string, string> = {
  w: "rite a professional email about ",
  h: "elp me plan ",
  c: "reate a marketing plan for ",
  e: "xplain ",
  s: "ummarize ",
  g: "enerate an image of ",
  m: "ake a checklist for ",
  r: "esearch ",
  b: "uild ",
  t: "ranslate ",
  a: "nalyze ",
  d: "raft ",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trimStart();
}

export function getPromptHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function rememberPrompt(prompt: string): void {
  const clean = prompt.trim();
  if (clean.length < 8 || clean.length > 300) return;
  try {
    const history = getPromptHistory().filter((p) => p.toLowerCase() !== clean.toLowerCase());
    history.unshift(clean);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
  } catch {
    /* storage unavailable — suggestions still work from the corpus */
  }
}

/**
 * Returns the completion text that should be appended to `input`,
 * or null when there is nothing confident to suggest.
 */
export function suggestCompletion(input: string): string | null {
  const raw = input;
  if (!raw.trim()) return null;
  // Don't interrupt multi-line / long-form writing.
  if (raw.includes("\n") || raw.length > 160) return null;

  const typed = normalize(raw);

  // Single first letter → offer a strong starter.
  if (typed.length === 1) {
    const hint = STARTER_HINTS[typed];
    return hint ?? null;
  }

  const candidates = [...getPromptHistory(), ...PROMPT_CORPUS];

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (lower.length <= typed.length) continue;
    if (lower.startsWith(typed)) {
      return candidate.slice(typed.length);
    }
  }

  // Fall back to matching the last few words anywhere in a candidate,
  // so mid-sentence typing still gets a continuation.
  const words = typed.split(" ");
  if (words.length >= 2) {
    const tail = words.slice(-3).join(" ");
    if (tail.length >= 5) {
      for (const candidate of candidates) {
        const idx = candidate.toLowerCase().indexOf(tail);
        if (idx > -1 && idx + tail.length < candidate.length) {
          return candidate.slice(idx + tail.length);
        }
      }
    }
  }

  return null;
}

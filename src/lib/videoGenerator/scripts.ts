import type { HookCopy, VideoHookVariant } from "./types";

export const HOOK_VARIANTS: Record<VideoHookVariant, HookCopy> = {
  privacy: {
    headline: "Your chats are being read.",
    voiceover: "Stop. Before you send one more message to ChatGPT… watch this.",
  },
  developer: {
    headline: "Your API keys are in the cloud.",
    voiceover: "Developers — you pasted secrets into ChatGPT. Here's what that actually means.",
    subline: "Keys. Tokens. Env vars.",
  },
  student: {
    headline: "Your essays train their AI.",
    voiceover: "Students — every essay you paste in? It might be training someone else's model.",
    subline: "Your words. Their dataset.",
  },
};

export const PAIN_COPY: Record<
  VideoHookVariant,
  { headline: string; left: string[]; right: string[] }
> = {
  privacy: {
    headline: "Every prompt can live on someone else's server forever.",
    left: ["Ideas stored", "Secrets logged", "No real delete"],
    right: ["Your journal", "Your therapy", "Your startup pitch"],
  },
  developer: {
    headline: "That .env paste? It's not ephemeral.",
    left: ["API keys cached", "Tokens in logs", "Training data risk"],
    right: ["AWS secrets", "Stripe keys", "Internal URLs"],
  },
  student: {
    headline: "Your homework might be someone else's training set.",
    left: ["Essays retained", "Style copied", "No opt-out"],
    right: ["College apps", "Research drafts", "Personal stories"],
  },
};

export const SHARE_LINES: Record<VideoHookVariant, { quote: string; cta: string }> = {
  privacy: {
    quote:
      "If you wouldn't read your journal out loud in a coffee shop… why are you doing it in a chat box?",
    cta: "Tag 1 person who still uses normal AI for private stuff.",
  },
  developer: {
    quote: "If you wouldn't commit secrets to GitHub… why paste them into ChatGPT?",
    cta: "Tag a dev who still pastes .env files into AI.",
  },
  student: {
    quote: "If you wouldn't hand your essay to a stranger… why upload it to a chatbot?",
    cta: "Tag a friend who writes papers in ChatGPT.",
  },
};

export const VARIANT_LABELS: Record<VideoHookVariant, string> = {
  privacy: "Privacy hook",
  developer: "Developer hook",
  student: "Student hook",
};

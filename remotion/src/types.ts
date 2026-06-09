export type HookVariant = "privacy" | "developer" | "student";

export interface ViralShortProps {
  hookVariant?: HookVariant;
}

export interface HookCopy {
  headline: string;
  voiceover: string;
  subline?: string;
}

export const HOOK_VARIANTS: Record<HookVariant, HookCopy> = {
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

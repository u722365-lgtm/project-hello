import type { HookVariant } from "./types";
import type { SceneId } from "./scenes/timing";

/** Default TTS voice — confident US male, good for short-form */
export const TTS_VOICE = "en-US-AndrewNeural";

export const VOICEOVER_SCRIPTS: Record<HookVariant, Record<SceneId, string>> = {
  privacy: {
    hook: "Stop. Before you send one more message to ChatGPT… watch this.",
    pain: "Every prompt you type — your ideas, your code, your secrets — can live on someone else's server forever. Not paranoia. Architecture.",
    twist: "So we built the opposite. ShadowTalk AI. Private. Encrypted. Think AI — without broadcasting your brain to the internet.",
    proof: "Watch this. Same power. None of the exposure. Try it in ten seconds at shadowtalk-ai.com.",
    share: "If you wouldn't read your journal out loud in a coffee shop… why are you doing it in a chat box? Tag one person who still uses normal AI for private stuff. Send this to them. Seriously.",
    cta: "Link in bio. ShadowTalk AI. Think AI. Think ShadowTalk. Free to try.",
    loop: "Comment SHADOW if you want Part 2.",
  },
  developer: {
    hook: "Developers — you pasted secrets into ChatGPT. Here's what that actually means.",
    pain: "That dot env paste? It's not ephemeral. API keys get cached. Tokens end up in logs. And there's real training-data risk.",
    twist: "So we built the opposite. ShadowTalk AI. Encrypted chat for the stuff you should never put in a public model.",
    proof: "Watch this. Draft code and configs without shipping your keys to the cloud. shadowtalk-ai.com.",
    share: "If you wouldn't commit secrets to GitHub… why paste them into ChatGPT? Tag a dev who still pastes env files into AI.",
    cta: "ShadowTalk AI. Think AI. Think ShadowTalk. Free to try.",
    loop: "Comment SHADOW for the dev security deep-dive.",
  },
  student: {
    hook: "Students — every essay you paste in might be training someone else's model.",
    pain: "Your homework can be retained. Your writing style copied. And there's often no real opt-out.",
    twist: "So we built the opposite. ShadowTalk AI. Private AI for drafts, research, and ideas that are actually yours.",
    proof: "Watch this. Same help. None of the exposure. Try shadowtalk-ai.com.",
    share: "If you wouldn't hand your essay to a stranger… why upload it to a chatbot? Tag a friend who writes papers in ChatGPT.",
    cta: "ShadowTalk AI. Think AI. Think ShadowTalk. Free to try.",
    loop: "Comment SHADOW if you want the student privacy guide.",
  },
};

export function voiceoverAssetPath(variant: HookVariant, scene: SceneId): string {
  return `audio/${variant}/${scene}.mp3`;
}

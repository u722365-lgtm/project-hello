export type VideoHookVariant = "privacy" | "developer" | "student";

export type VideoSceneId =
  | "hook"
  | "pain"
  | "twist"
  | "proof"
  | "share"
  | "cta"
  | "loop";

export interface HookCopy {
  headline: string;
  voiceover: string;
  subline?: string;
}

export const VIDEO_SCENE_ORDER: VideoSceneId[] = [
  "hook",
  "pain",
  "twist",
  "proof",
  "share",
  "cta",
  "loop",
];

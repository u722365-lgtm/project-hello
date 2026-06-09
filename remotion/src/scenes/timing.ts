import { FPS } from "../theme";

/** Scene timings (30fps) — matches the 60s viral script */
export const SCENES = {
  hook: { from: 0, duration: 90 }, // 0:00–0:03
  pain: { from: 90, duration: 270 }, // 0:03–0:12
  twist: { from: 360, duration: 300 }, // 0:12–0:22
  proof: { from: 660, duration: 390 }, // 0:22–0:35
  share: { from: 1050, duration: 300 }, // 0:35–0:45
  cta: { from: 1350, duration: 300 }, // 0:45–0:55
  loop: { from: 1650, duration: 150 }, // 0:55–1:00
} as const;

export type SceneId = keyof typeof SCENES;
export const SCENE_IDS = Object.keys(SCENES) as SceneId[];
export const TOTAL_FRAMES = FPS * 60;

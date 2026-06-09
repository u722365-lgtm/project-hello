import type { VideoSceneId } from "./types";

export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 720;
export const VIDEO_HEIGHT = 1280;
export const VIDEO_DURATION_SECONDS = 60;
export const VIDEO_TOTAL_FRAMES = VIDEO_FPS * VIDEO_DURATION_SECONDS;

/** Scene timings (30fps) — matches viral script */
export const VIDEO_SCENES: Record<VideoSceneId, { from: number; duration: number }> = {
  hook: { from: 0, duration: 90 },
  pain: { from: 90, duration: 270 },
  twist: { from: 360, duration: 300 },
  proof: { from: 660, duration: 390 },
  share: { from: 1050, duration: 300 },
  cta: { from: 1350, duration: 300 },
  loop: { from: 1650, duration: 150 },
};

export function sceneAtFrame(frame: number): VideoSceneId {
  const entries = Object.entries(VIDEO_SCENES) as [VideoSceneId, { from: number; duration: number }][];
  for (let i = entries.length - 1; i >= 0; i--) {
    const [id, s] = entries[i];
    if (frame >= s.from) return id;
  }
  return "hook";
}

export function localFrame(frame: number, scene: VideoSceneId): number {
  return frame - VIDEO_SCENES[scene].from;
}

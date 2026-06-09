import type { VideoHookVariant, VideoSceneId } from "./types";
import { VIDEO_SCENE_ORDER } from "./types";

const SCENES_WITH_AUDIO: VideoSceneId[] = VIDEO_SCENE_ORDER;

export function sceneAudioUrl(variant: VideoHookVariant, scene: VideoSceneId): string {
  return `/video/audio/${variant}/${scene}.mp3`;
}

export function resolveAudioUrl(variant: VideoHookVariant, scene: VideoSceneId): string {
  return sceneAudioUrl(variant, scene);
}

export async function fetchSceneAudioBuffers(variant: VideoHookVariant): Promise<Map<VideoSceneId, ArrayBuffer>> {
  const map = new Map<VideoSceneId, ArrayBuffer>();
  await Promise.all(
    SCENES_WITH_AUDIO.map(async (scene) => {
      const url = resolveAudioUrl(variant, scene);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Missing audio: ${url}`);
      map.set(scene, await res.arrayBuffer());
    }),
  );
  return map;
}

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { drawVideoFrame } from "./drawFrame";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_TOTAL_FRAMES, VIDEO_WIDTH } from "./timing";
import type { VideoHookVariant } from "./types";
import { VIDEO_SCENE_ORDER } from "./types";
import { fetchSceneAudioBuffers } from "./audio";

export interface ExportProgress {
  phase: "loading" | "audio" | "frames" | "encoding" | "done";
  percent: number;
  message: string;
}

let ffmpegInstance: FFmpeg | null = null;

async function getFfmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  const ffmpeg = new FFmpeg();
  const base = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Frame encode failed"));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      0.85,
    );
  });
}

export async function exportViralShortMp4(
  variant: VideoHookVariant,
  onProgress: (p: ExportProgress) => void,
): Promise<Blob> {
  onProgress({ phase: "loading", percent: 2, message: "Loading video engine…" });
  const ffmpeg = await getFfmpeg();

  onProgress({ phase: "audio", percent: 8, message: "Loading voiceover…" });
  const audioBuffers = await fetchSceneAudioBuffers(variant);

  const concatList = VIDEO_SCENE_ORDER.map((s) => `file '${s}.mp3'`).join("\n");
  await ffmpeg.writeFile("concat.txt", concatList);
  for (const scene of VIDEO_SCENE_ORDER) {
    const buf = audioBuffers.get(scene);
    if (!buf) throw new Error(`Missing audio for ${scene}`);
    await ffmpeg.writeFile(`${scene}.mp3`, new Uint8Array(buf));
  }
  await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "voiceover.mp3"]);

  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  onProgress({ phase: "frames", percent: 12, message: "Rendering frames…" });
  for (let frame = 0; frame < VIDEO_TOTAL_FRAMES; frame++) {
    drawVideoFrame(ctx, frame, variant);
    const jpeg = await canvasToJpeg(canvas);
    const name = `frame${String(frame).padStart(5, "0")}.jpg`;
    await ffmpeg.writeFile(name, jpeg);
    if (frame % 30 === 0) {
      const pct = 12 + Math.floor((frame / VIDEO_TOTAL_FRAMES) * 58);
      onProgress({
        phase: "frames",
        percent: pct,
        message: `Rendering frame ${frame + 1} / ${VIDEO_TOTAL_FRAMES}`,
      });
    }
  }

  onProgress({ phase: "encoding", percent: 75, message: "Encoding MP4…" });
  await ffmpeg.exec([
    "-framerate",
    String(VIDEO_FPS),
    "-i",
    "frame%05d.jpg",
    "-i",
    "voiceover.mp3",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    "output.mp4",
  ]);

  onProgress({ phase: "done", percent: 100, message: "Done!" });
  const data = await ffmpeg.readFile("output.mp4");
  return new Blob([data], { type: "video/mp4" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

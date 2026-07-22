export type MediaMimeType =
  | 'image/png'
  | 'image/jpeg'
  | 'audio/wav'
  | 'audio/mp3'
  | 'video/mp4';

export interface MediaPipelineInput {
  mimeType: MediaMimeType;
  bytes: ArrayBuffer | Uint8Array;
}

export interface MediaPipelineResult {
  success: boolean;
  outputPath?: string;
  mimeType: MediaMimeType;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface TauriMediaPipeline {
  /** Convert/summarize/transcode media using Rust FFmpeg/vision models */
  transcode(input: MediaPipelineInput, targetMime: MediaMimeType): Promise<MediaPipelineResult>;
  /** Extract audio or frames from a video asset, rendered to app-local storage */
  extract(input: MediaPipelineInput): Promise<MediaPipelineResult>;
}

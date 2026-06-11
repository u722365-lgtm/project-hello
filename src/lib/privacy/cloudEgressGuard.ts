import { assertCloudAllowed } from "./deviceOnlyPledge";

const CLOUD_AI_PATHS = [
  "/functions/v1/chat",
  "/functions/v1/jules-agent",
  "/functions/v1/document-ai",
  "/functions/v1/generate-presentation",
  "/functions/v1/cyber-ai-copilot",
  "/functions/v1/shadowspectre",
  "/functions/v1/proactive-ai",
  "/functions/v1/vision-analyze",
  "/functions/v1/image-edit",
];

/** Block fetches to cloud AI endpoints when device-only pledge is active. */
export function guardCloudFetch(url: string, feature: string): void {
  const path = url.includes("://") ? new URL(url).pathname : url;
  if (CLOUD_AI_PATHS.some((p) => path.includes(p))) {
    assertCloudAllowed(feature);
  }
}

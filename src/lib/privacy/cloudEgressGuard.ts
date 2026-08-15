import { assertCloudAllowed } from "./deviceOnlyPledge";

const CLOUD_AI_PATHS: string[] = [];

/** Block fetches to cloud AI endpoints when device-only pledge is active. */
export function guardCloudFetch(url: string, feature: string): void {
  const path = url.includes("://") ? new URL(url).pathname : url;
  if (CLOUD_AI_PATHS.some((p) => path.includes(p))) {
    assertCloudAllowed(feature);
  }
}

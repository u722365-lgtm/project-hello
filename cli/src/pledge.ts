import { loadConfig } from "./config.js";

export const DEVICE_ONLY_MESSAGE =
  "Device-only pledge active: data stays on this machine. Use --allow-cloud to opt in, or run a local model via Ollama.";

export function isDeviceOnlyPledgeActive(): boolean {
  return loadConfig().pledge.deviceOnly !== false;
}

export function hasCloudOptIn(): boolean {
  return loadConfig().pledge.cloudOptIn === true;
}

export function canUseCloudAI(): boolean {
  return !isDeviceOnlyPledgeActive() || hasCloudOptIn();
}

export function assertCloudAllowed(feature: string): void {
  if (!canUseCloudAI()) {
    throw new Error(`${DEVICE_ONLY_MESSAGE} (blocked: ${feature})`);
  }
}

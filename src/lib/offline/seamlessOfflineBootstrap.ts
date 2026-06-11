/**
 * Logged-in bootstrap: use cloud AI immediately and download the on-device model in the background.
 */

import { ensureAutoCloudUntilLocalReady } from "@/lib/privacy/deviceOnlyPledge";
import { bootstrapCachedLocalModel } from "@/lib/offline/bootstrapLocalModel";
import { startSilentTierAInstall } from "@/lib/offline/tierAInstall";

let startedForSession = false;

export function resetSeamlessOfflineBootstrap(): void {
  startedForSession = false;
}

/** Cloud chat now; Tier-A SmolLM installs silently; resume any cached Gemma download. */
export function bootstrapSeamlessOfflineForLoggedInUser(): void {
  if (startedForSession || typeof window === "undefined") return;
  startedForSession = true;

  ensureAutoCloudUntilLocalReady();
  startSilentTierAInstall();
  void bootstrapCachedLocalModel();
}

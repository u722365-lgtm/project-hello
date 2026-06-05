import { detectComplexTask } from "@/lib/see/complexTaskDetector";
import type { ShadowExecutionChatDetection } from "@/lib/execution/inferFromChat";
import { isAutonomousModeEnabled } from "./config";

export type AutonomousRouteDecision = {
  launchInChat: boolean;
  redirectToExecute: boolean;
  reason: string;
};

/** Decide whether to run Shadow Execution inside chat vs redirect to /execute. */
export function resolveAutonomousRoute(
  message: string,
  execHint: ShadowExecutionChatDetection,
  options?: { preferSeeRouting?: boolean; forceInChat?: boolean },
): AutonomousRouteDecision {
  if (!execHint.use) {
    return { launchInChat: false, redirectToExecute: false, reason: "Not a multi-step task" };
  }

  const autonomyOn = options?.forceInChat ?? isAutonomousModeEnabled();
  const complex = detectComplexTask(message);
  const seeThreshold = options?.preferSeeRouting ? 0.48 : 0.55;
  const autoRoute =
    execHint.autoRoute ||
    (options?.preferSeeRouting && execHint.confidence >= seeThreshold);

  if (!autoRoute) {
    return { launchInChat: false, redirectToExecute: false, reason: "Below auto-route confidence" };
  }

  if (autonomyOn && complex.useSEE && execHint.confidence >= seeThreshold) {
    return {
      launchInChat: true,
      redirectToExecute: false,
      reason: complex.reason || execHint.reason,
    };
  }

  return {
    launchInChat: false,
    redirectToExecute: true,
    reason: execHint.reason,
  };
}

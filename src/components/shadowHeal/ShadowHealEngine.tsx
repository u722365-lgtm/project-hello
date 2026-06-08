import { useEffect } from "react";
import { startShadowHealEngine } from "@/lib/shadowHeal/shadowHealEngine";

/**
 * Hidden 24/7 healing engine — no UI. Runs wiring probes, traffic guard,
 * error queue drain, and runtime recovery sync while the app is open.
 */
export function ShadowHealEngine() {
  useEffect(() => startShadowHealEngine(), []);
  return null;
}

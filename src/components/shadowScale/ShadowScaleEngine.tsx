import { useEffect } from "react";
import { startShadowScaleEngine } from "@/lib/shadowScale/shadowScaleEngine";

/** Hidden autonomous growth engine — no UI. */
export function ShadowScaleEngine() {
  useEffect(() => startShadowScaleEngine(), []);
  return null;
}

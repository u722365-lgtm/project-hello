import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { startShadowScaleEngine } from "@/lib/shadowScale/shadowScaleEngine";

/** Hidden autonomous growth engine — no UI. */
export function ShadowScaleEngine() {
  const { user } = useAuth();
  useEffect(() => {
    return startShadowScaleEngine(() => user?.id ?? null);
  }, [user?.id]);
  return null;
}

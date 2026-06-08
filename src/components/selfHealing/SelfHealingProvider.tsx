import { useEffect, type ReactNode } from "react";
import {
  installGlobalErrorCapture,
  scheduleSelfHealBootstrap,
} from "@/lib/selfHealing/errorCapture";

/** Passive error capture + bootstrap probe. Continuous healing runs in ShadowHealEngine. */
export const SelfHealingProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    installGlobalErrorCapture();
    scheduleSelfHealBootstrap();
  }, []);

  return <>{children}</>;
};

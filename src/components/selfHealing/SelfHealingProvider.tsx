import { useEffect, type ReactNode } from "react";
import { installGlobalErrorCapture } from "@/lib/selfHealing/errorCapture";
import { startAutoRecoverySync } from "@/lib/selfHealing/autoRecover";

export const SelfHealingProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    installGlobalErrorCapture();
    const stop = startAutoRecoverySync();
    return () => {
      stop?.();
    };
  }, []);
  return <>{children}</>;
};

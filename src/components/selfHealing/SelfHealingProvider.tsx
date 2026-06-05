import { useEffect, type ReactNode } from "react";
import {
  installGlobalErrorCapture,
  scheduleSelfHealBootstrap,
} from "@/lib/selfHealing/errorCapture";
import { startAutoRecoverySync } from "@/lib/selfHealing/autoRecover";
import { isSelfHealRemoteEnabled } from "@/lib/selfHealing/selfHealConfig";
import { probeSelfHealEndpoint } from "@/lib/selfHealing/probeSelfHeal";

export const SelfHealingProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    installGlobalErrorCapture();
    scheduleSelfHealBootstrap();

    let stop: (() => void) | undefined;
    const maybeStartRecovery = () => {
      if (!isSelfHealRemoteEnabled()) return;
      stop = startAutoRecoverySync();
    };

    void probeSelfHealEndpoint().then((ok) => {
      if (ok) maybeStartRecovery();
    });

    return () => {
      stop?.();
    };
  }, []);

  return <>{children}</>;
};

import { useCallback, useEffect, useState } from "react";
import {
  detectHardwareProfile,
  getCachedHardwareProfile,
  type HardwareProfile,
} from "@/lib/hardwareIntelligence";
import { ACCELERATION_CHANGE_EVENT } from "@/lib/webgpuRuntime";

export function useHardwareIntelligence() {
  const [profile, setProfile] = useState<HardwareProfile | null>(() => getCachedHardwareProfile());
  const [loading, setLoading] = useState(!getCachedHardwareProfile());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await detectHardwareProfile();
      setProfile(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onAccel = () => void refresh();
    window.addEventListener(ACCELERATION_CHANGE_EVENT, onAccel);
    return () => window.removeEventListener(ACCELERATION_CHANGE_EVENT, onAccel);
  }, [refresh]);

  return { profile, loading, refresh };
}

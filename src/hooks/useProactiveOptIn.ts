import { useCallback, useEffect, useState } from "react";
import { PROACTIVE_ETHICS } from "@/lib/ethicalGrowth";

export function useProactiveOptIn() {
  const [optedIn, setOptedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(PROACTIVE_ETHICS.storageKey);
      setOptedIn(v === "1");
    } catch {
      setOptedIn(false);
    }
    setLoaded(true);
  }, []);

  const setOptIn = useCallback((value: boolean) => {
    setOptedIn(value);
    try {
      if (value) localStorage.setItem(PROACTIVE_ETHICS.storageKey, "1");
      else localStorage.removeItem(PROACTIVE_ETHICS.storageKey);
    } catch {
      /* ignore */
    }
  }, []);

  return { optedIn, loaded, setOptIn, enable: () => setOptIn(true), disable: () => setOptIn(false) };
}

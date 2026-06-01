import { useCallback, useEffect, useRef, useState } from "react";
import type { ProfileTabId } from "@/lib/profileTypes";
import { settingsHapticTick } from "@/lib/settingsFeedback";

export function useProfileSectionNav(
  tabIds: readonly string[],
  currentTab: ProfileTabId,
  onSelect: (id: string) => void,
) {
  const index = Math.max(0, tabIds.indexOf(currentTab));
  const prevIndexRef = useRef(index);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (index !== prev) {
      setDirection(index > prev ? 1 : -1);
      prevIndexRef.current = index;
    }
  }, [index]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(tabIds.length - 1, nextIndex));
      if (clamped === index) return;
      settingsHapticTick();
      onSelect(tabIds[clamped]);
    },
    [index, onSelect, tabIds],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (typing && !(e.metaKey || e.ctrlKey)) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        goToIndex(index + 1);
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        goToIndex(index - 1);
      }
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= tabIds.length) {
        e.preventDefault();
        goToIndex(num - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToIndex, index, tabIds.length]);

  return {
    direction,
    index,
    progress: (index + 1) / tabIds.length,
  };
}

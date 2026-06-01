import { useCallback, useEffect, useRef, useState } from "react";
import type { SettingsSectionId } from "@/lib/settingsTypes";
import { settingsHapticTick } from "@/lib/settingsFeedback";

export function useSettingsSectionNav(
  sectionIds: readonly string[],
  currentSection: SettingsSectionId,
  onSelect: (id: string) => void,
) {
  const index = Math.max(0, sectionIds.indexOf(currentSection));
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
      const clamped = Math.max(0, Math.min(sectionIds.length - 1, nextIndex));
      if (clamped === index) return;
      settingsHapticTick();
      onSelect(sectionIds[clamped]);
    },
    [index, onSelect, sectionIds],
  );

  const goNext = useCallback(() => goToIndex(index + 1), [goToIndex, index]);
  const goPrev = useCallback(() => goToIndex(index - 1), [goToIndex, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (typing && !(e.metaKey || e.ctrlKey)) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        if (!typing) {
          e.preventDefault();
          goNext();
        }
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        if (!typing) {
          e.preventDefault();
          goPrev();
        }
      }

      const num = parseInt(e.key, 10);
      if (!typing && num >= 1 && num <= sectionIds.length && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        goToIndex(num - 1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, goToIndex, sectionIds.length]);

  return { direction, index, progress: (index + 1) / sectionIds.length, goNext, goPrev, goToIndex };
}

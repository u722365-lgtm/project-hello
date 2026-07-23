import { useEffect } from "react";

/**
 * Fixes iOS Safari / Android keyboard covering the chat composer.
 * Sets a `--vvh` CSS variable to the visualViewport height so
 * `height: var(--vvh, 100dvh)` on the chat shell shrinks as the
 * on-screen keyboard opens, keeping the composer above it.
 * Also sets `--kbd` to the keyboard offset for elements that need
 * to lift above the keyboard on iOS where the layout viewport
 * doesn't move.
 */
export function MobileViewportFix() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    const root = document.documentElement;

    const apply = () => {
      const h = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      // iOS: layout viewport stays full-height while visualViewport shrinks —
      // this is the delta the composer must lift by.
      const keyboardOffset = Math.max(0, window.innerHeight - h - offsetTop);
      root.style.setProperty("--vvh", `${h}px`);
      root.style.setProperty("--kbd", `${keyboardOffset}px`);
      if (keyboardOffset > 40) root.classList.add("kbd-open");
      else root.classList.remove("kbd-open");
    };

    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("orientationchange", apply);
    window.addEventListener("resize", apply);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  return null;
}

export default MobileViewportFix;

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { shouldSkipGlobalScrollReveal } from "@/lib/siteMotion";
import { shouldReduceMotionForPerf } from "@/lib/perf/leanMotion";

const REVEAL_SELECTORS = [
  "main section",
  "main article",
  ".min-h-screen section",
  ".about-page section",
  "[data-reveal]",
  ".card-hover",
  ".bento-item",
  ".landing-interactive-card",
];

const EXCLUDE_SELECTORS = [
  "[data-no-reveal]",
  "[data-no-motion]",
  ".landing-page-content",
  ".shadowtalk-composer",
  "[role='log']",
  ".messages-container",
  ".chat-messages",
];

function isExcluded(el: Element): boolean {
  return EXCLUDE_SELECTORS.some((sel) => el.closest(sel));
}

/**
 * Adds scroll-triggered reveal classes to common page sections (CSS-driven).
 * Skips chat/admin for performance.
 */
export function GlobalScrollReveal() {
  const { pathname } = useLocation();
  const reduced = shouldReduceMotionForPerf(useReducedMotion() ?? false);

  useEffect(() => {
    if (reduced || shouldSkipGlobalScrollReveal(pathname)) return;

    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("st-reveal--visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );

    const mark = () => {
      const nodes: Element[] = [];
      REVEAL_SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (seen.has(el) || isExcluded(el) || el.closest(".landing-page-content")) return;
          seen.add(el);
          nodes.push(el);
        });
      });

      nodes.forEach((el, i) => {
        el.classList.add("st-reveal");
        (el as HTMLElement).style.setProperty(
          "--st-reveal-delay",
          `${Math.min(i % 10, 9) * 0.05}s`,
        );
        observer.observe(el);
      });
    };

    const t = window.requestAnimationFrame(() => {
      mark();
      window.setTimeout(mark, 400);
    });

    return () => {
      window.cancelAnimationFrame(t);
      observer.disconnect();
      document.querySelectorAll(".st-reveal").forEach((el) => {
        el.classList.remove("st-reveal", "st-reveal--visible");
        (el as HTMLElement).style.removeProperty("--st-reveal-delay");
      });
    };
  }, [pathname, reduced]);

  return null;
}

export default GlobalScrollReveal;

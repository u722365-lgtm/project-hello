import type { TrafficLevel } from "./shadowHealConfig";
import { getTrafficLevel, setTrafficLevel } from "./shadowHealConfig";

type Metrics = {
  longTasks: number;
  memoryRatio: number | null;
};

const metrics: Metrics = { longTasks: 0, memoryRatio: null };
let observer: PerformanceObserver | null = null;

export function startTrafficGuard(): () => void {
  if (typeof window === "undefined") return () => {};

  if ("PerformanceObserver" in window) {
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "longtask" && entry.duration > 80) {
            metrics.longTasks += 1;
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      /* longtask unsupported */
    }
  }

  return () => {
    observer?.disconnect();
    observer = null;
  };
}

export function evaluateTraffic(): TrafficLevel {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  };
  if (perf.memory) {
    metrics.memoryRatio = perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit;
  }

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const slowNav = nav ? nav.loadEventEnd - nav.startTime > 6000 : false;

  const prev = getTrafficLevel();
  let next: TrafficLevel = "normal";

  if (metrics.longTasks >= 8 || (metrics.memoryRatio !== null && metrics.memoryRatio > 0.88) || slowNav) {
    next = "critical";
  } else if (metrics.longTasks >= 3 || (metrics.memoryRatio !== null && metrics.memoryRatio > 0.75)) {
    next = "elevated";
  }

  if (next !== prev) setTrafficLevel(next);

  metrics.longTasks = Math.max(0, metrics.longTasks - 2);

  return next;
}

export function getTrafficMetrics(): Metrics {
  return { ...metrics };
}

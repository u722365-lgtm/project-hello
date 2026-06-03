import { THEME_TEMPLATES } from "@/lib/themes/generateTemplates";
import type { BehaviorEvent, LearnedProfile } from "./types";
import type { UiUxSuggestion } from "./uiUxTypes";
import { isThemeUiUxSuggestion } from "./uiUxTypes";

const PRODUCT_HEAVY = ["/chatbot", "/missioncontrol", "/ide", "/research", "/workspace"];
const DOCS_HEAVY = ["/docs", "/settings", "/help", "/faq"];
const CREATIVE_HEAVY = ["/studio", "/presentations", "/creative"];

function slugToTemplatePrefix(path: string): string {
  if (PRODUCT_HEAVY.some((p) => path.startsWith(p))) return "neural";
  if (path.includes("cyber") || path.includes("security")) return "sovereign";
  if (CREATIVE_HEAVY.some((p) => path.startsWith(p))) return "pastel";
  if (DOCS_HEAVY.some((p) => path.startsWith(p))) return "mono";
  if (path.includes("pricing") || path.includes("founder")) return "elite";
  return "aurora";
}

function pickTemplateId(prefix: string, variant: number): string {
  const match = THEME_TEMPLATES.find((t) => t.id === `${prefix}-${String(variant).padStart(2, "0")}`);
  return match?.id ?? THEME_TEMPLATES[0]?.id ?? "neural-01";
}

export function aggregatePageVisits(events: BehaviorEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type !== "page_view") continue;
    const path = String(e.payload?.path || "/");
    counts[path] = (counts[path] || 0) + 1;
  }
  return counts;
}

export function analyzeUiUx(
  events: BehaviorEvent[],
  profile: LearnedProfile,
  confidence: number,
): { pageVisitCounts: Record<string, number>; suggestions: UiUxSuggestion[] } {
  const pageVisitCounts = aggregatePageVisits(events);
  const merged: Record<string, number> = { ...(profile.pageVisitCounts || {}), ...pageVisitCounts };
  for (const [k, v] of Object.entries(pageVisitCounts)) {
    merged[k] = (profile.pageVisitCounts?.[k] || 0) + v;
  }

  const suggestions: UiUxSuggestion[] = [];
  const now = new Date().toISOString();

  if (confidence < 0.25) {
    return { pageVisitCounts: merged, suggestions };
  }

  const sortedPaths = Object.entries(merged).sort((a, b) => b[1] - a[1]);
  const topPath = sortedPaths[0]?.[0];
  const totalViews = Object.values(merged).reduce((a, b) => a + b, 0);
  const rapidNav = events.filter((e) => e.type === "page_view").length;
  const navPerMinute =
    rapidNav > 0
      ? rapidNav /
        Math.max(
          1,
          (events[events.length - 1]?.ts - events[0]?.ts) / 60_000,
        )
      : 0;

  if (!profile.themeSuggestionCompleted && topPath && totalViews >= 8) {
    const prefix = slugToTemplatePrefix(topPath);
    const variant = (sortedPaths.length % 10) + 1;
    const templateId = pickTemplateId(prefix, variant);
    const cat = THEME_TEMPLATES.find((t) => t.id === templateId)?.category ?? "Neural Core";
    suggestions.push({
      id: `theme-${templateId}`,
      title: `Try the ${cat} theme`,
      description: "ShadowTalk matched a visual template to how you move through the app.",
      reason: `You visit ${topPath.replace(/^\//, "") || "workspace"} most often`,
      suggestedTemplateId: templateId,
      priority: 90,
      createdAt: now,
    });
  }

  if (navPerMinute > 12 && confidence >= 0.35) {
    suggestions.push({
      id: "ux-calm-motion",
      title: "Calmer animations site-wide",
      description: "Reduce motion while you hop between tools — easier on focus.",
      reason: "Fast navigation pattern detected",
      tweak: "reduce_motion",
      priority: 70,
      createdAt: now,
    });
  }

  const chatHeavy = (merged["/chatbot"] || 0) / Math.max(totalViews, 1) > 0.5;
  if (chatHeavy && confidence >= 0.4) {
    suggestions.push({
      id: "ux-compact-chat",
      title: "Compact workspace density",
      description: "Tighter spacing in chat and panels for more content on screen.",
      reason: "You spend most sessions in the AI workspace",
      tweak: "compact_density",
      priority: 60,
      createdAt: now,
    });
  }

  const docsHeavy = DOCS_HEAVY.reduce((s, p) => s + (merged[p] || 0), 0) / Math.max(totalViews, 1) > 0.25;
  if (!profile.themeSuggestionCompleted && docsHeavy) {
    suggestions.push({
      id: "theme-mono-03",
      title: "Readable Mono Terminal theme",
      description: "Higher contrast and calmer motion for long reading sessions.",
      reason: "Frequent docs and settings visits",
      suggestedTemplateId: "mono-03",
      tweak: "high_contrast",
      priority: 65,
      createdAt: now,
    });
  }

  if (!profile.themeSuggestionCompleted && profile.peakHour !== undefined && (profile.peakHour >= 22 || profile.peakHour <= 5)) {
    suggestions.push({
      id: "theme-sovereign-02",
      title: "Softer night contrast",
      description: "Sovereign Dark lowers glare for late-night builds.",
      reason: "Peak activity is during night hours",
      suggestedTemplateId: "sovereign-02",
      priority: 55,
      createdAt: now,
    });
  }

  const themeCandidates = suggestions.filter(isThemeUiUxSuggestion);
  const nonTheme = suggestions.filter((s) => !isThemeUiUxSuggestion(s));

  let finalSuggestions: UiUxSuggestion[];

  if (profile.themeSuggestionCompleted) {
    finalSuggestions = nonTheme;
  } else {
    const bestTheme = themeCandidates.sort((a, b) => b.priority - a.priority)[0];
    if (bestTheme) {
      finalSuggestions = [bestTheme, ...nonTheme];
    } else if (confidence >= 0.3 && totalViews >= 3) {
      finalSuggestions = [
        {
          id: "browse-templates",
          title: "Explore 100 UI templates",
          description: "Download themes and apply them instantly across ShadowTalk.",
          reason: "Personalize the entire site from /templates",
          priority: 40,
          createdAt: now,
        },
        ...nonTheme,
      ];
    } else {
      finalSuggestions = nonTheme;
    }
  }

  const deduped = finalSuggestions
    .sort((a, b) => b.priority - a.priority)
    .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
    .slice(0, 4);

  return { pageVisitCounts: merged, suggestions: deduped };
}

export function applyUiUxTweak(tweak: UiUxSuggestion["tweak"]): void {
  const root = document.documentElement;
  if (!tweak) return;
  if (tweak === "reduce_motion") root.dataset.shadowtalkMotion = "calm";
  if (tweak === "compact_density") root.dataset.shadowtalkDensity = "compact";
  if (tweak === "spacious_density") root.dataset.shadowtalkDensity = "spacious";
  if (tweak === "high_contrast") {
    root.style.setProperty("--muted-foreground", "0 0% 78%");
  }
}

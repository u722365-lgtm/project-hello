import type { UiUxSuggestion } from "./uiUxTypes";

export type { UiUxSuggestion } from "./uiUxTypes";

export type BehaviorEventType =
  | "chat_send"
  | "mode_change"
  | "personality_change"
  | "feature_open"
  | "see_launch"
  | "regenerate"
  | "conversation_new"
  | "mission_complete"
  | "deep_research"
  | "image_gen"
  | "page_view"
  | "template_browse"
  | "theme_apply"
  | "ui_suggestion_dismiss";

export interface BehaviorEvent {
  id: string;
  ts: number;
  type: BehaviorEventType;
  payload?: Record<string, string | number | boolean>;
}

export interface ImprovementApplied {
  id: string;
  label: string;
  appliedAt: string;
  reason: string;
}

export interface LearnedProfile {
  version: 1;
  updatedAt: string;
  eventCount: number;
  confidence: number;
  preferredMode?: string;
  preferredPersonality?: string;
  preferSeeRouting?: boolean;
  topCategories: string[];
  peakHour?: number;
  systemHintAddon?: string;
  recentImprovements: ImprovementApplied[];
  /** Aggregated route visits for UI/UX adaptation */
  pageVisitCounts?: Record<string, number>;
  /** Active + recent UI/UX suggestions (themes, density, motion) */
  uiUxSuggestions?: UiUxSuggestion[];
  preferredTemplateCategory?: string;
  suggestedMotion?: "calm" | "normal" | "energetic";
  suggestedDensity?: "compact" | "comfortable" | "spacious";
}

export const EMPTY_PROFILE: LearnedProfile = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  eventCount: 0,
  confidence: 0,
  topCategories: [],
  recentImprovements: [],
};

export const PROFILE_SETTING_KEY = "auto_improve_profile";

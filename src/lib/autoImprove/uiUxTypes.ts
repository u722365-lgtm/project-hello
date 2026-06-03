export interface UiUxSuggestion {
  id: string;
  title: string;
  description: string;
  reason: string;
  /** Theme template id from /templates */
  suggestedTemplateId?: string;
  /** UX tweak applied without full theme */
  tweak?: "reduce_motion" | "compact_density" | "spacious_density" | "high_contrast";
  priority: number;
  createdAt: string;
}

export type PageVisitCounts = Record<string, number>;

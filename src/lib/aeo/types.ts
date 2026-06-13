export type AeoCategory =
  | "product"
  | "founder"
  | "comparison"
  | "pricing"
  | "privacy"
  | "features"
  | "technical"
  | "google";

export interface AeoAnswer {
  id: string;
  category: AeoCategory;
  question: string;
  /** Direct answer — first sentence must stand alone for LLM citation */
  answer: string;
  /** Optional entities for search clustering */
  keywords?: string[];
}

export interface AeoCorpusMeta {
  version: string;
  updated: string;
  brand: string;
  url: string;
  purpose: string;
}

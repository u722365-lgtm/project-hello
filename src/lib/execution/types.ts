export type DeliverableType = "general" | "strategy_report" | "research_brief" | "content_pack";

export interface ExecutionDeliverable {
  deliverableType: DeliverableType;
  strategy?: string;
  usedFallback: boolean;
  stepOutputs: any[];
  markdown: string;
}

/**
 * Agentic Metrics - Custom Telemetry Logger
 * Lightweight utility to track AI performance, latency, and costs.
 */

export type AiEventName = 
  | 'llm_completion'
  | 'agent_loop_failure'
  | 'agent_action_success';

export interface AiMetricPayload {
  model?: string;
  source?: string;
  ttftMs?: number;      // Time to first token
  totalMs?: number;     // Total duration
  inputTokens?: number; // Estimated
  outputTokens?: number;// Estimated
  error?: string;
  actionId?: string;
}

/**
 * Tracks AI metrics and outputs structured JSON to the console.
 * In a production backend, this would POST to a telemetry ingestion endpoint.
 */
export function trackAiMetrics(eventName: AiEventName, payload: AiMetricPayload) {
  const logData = {
    timestamp: new Date().toISOString(),
    event: eventName,
    ...payload,
  };

  // Structured logging for easy parsing by Datadog / Logstash / etc.
  console.log(`[agentic-metrics] ${JSON.stringify(logData)}`);
}

/**
 * Super naive token estimator based on string length.
 * ~4 chars per token for English text.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

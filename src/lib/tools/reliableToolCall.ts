/**
 * Tool reliability layer for ShadowTalk.
 *
 * Adds automatic retry, fallback routing, and observability for tool calls.
 * Designed to make flaky integrations (scraping, image generation, edge functions)
 * feel rock solid without changing consumer code.
 */

export type ToolCallOptions = {
  retries?: number;
  baseDelayMs?: number;
  fallback?: () => Promise<unknown> | unknown;
  timeoutMs?: number;
  name?: string;
};

export type ToolResult<T> = {
  ok: boolean;
  value?: T;
  error?: Error;
  attempts: number;
  durationMs: number;
};

export async function reliableToolCall<T>(
  fn: () => Promise<T>,
  options: ToolCallOptions = {},
): Promise<ToolResult<T>> {
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 350;
  const timeoutMs = options.timeoutMs ?? 20000;
  const name = options.name || 'tool';

  let lastError: Error | undefined;
  const started = Date.now();

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs),
        ),
      ]);
      return { ok: true, value: result, attempts: attempt, durationMs: Date.now() - started };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt <= retries) {
        const backoff = baseDelayMs * Math.pow(1.6, attempt - 1);
        await sleep(backoff);
      }
    }
  }

  if (options.fallback) {
    try {
      const fallbackResult = options.fallback();
      const value = await (fallbackResult instanceof Promise ? fallbackResult : Promise.resolve(fallbackResult));
      return { ok: true, value: value as T, attempts: retries + 1, durationMs: Date.now() - started, error: lastError };
    } catch (fallbackErr) {
      const fallbackError = fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr));
      return { ok: false, error: fallbackError, attempts: retries + 1, durationMs: Date.now() - started };
    }
  }

  return { ok: false, error: lastError!, attempts: retries + 1, durationMs: Date.now() - started };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

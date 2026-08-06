/**
 * BYOK Client — Direct-to-provider streaming chat.
 * 
 * When a user has configured their own API key, chat requests go
 * directly from their browser to the provider. This means:
 *   - $0 cost from shared pool
 *   - No rate limits from ShadowTalk
 *   - Full model catalog access
 *   - Keys never touch ShadowTalk servers
 * 
 * Supports OpenAI-compatible and Anthropic Messages API formats.
 */

import { decryptKey } from './crypto';
import { getByokProvider, type ByokProviderId } from './providers';

export interface ByokStreamOptions {
  providerId: ByokProviderId;
  messages: { role: string; content: string }[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
  onDelta?: (text: string, accumulated: string) => void;
  onProviderInfo?: (info: { provider: string; model: string; ttftMs?: number }) => void;
}

export interface ByokStreamResult {
  content: string;
  provider: string;
  model: string;
  ttftMs?: number;
  totalMs: number;
}\n
// ---- SSE line parser (OpenAI format) ----
function parseSseLine(line: string): string | null {
  if (!line.startsWith('data: ') || line === 'data: [DONE]') return null;
  try {
    const data = JSON.parse(line.slice(6));
    return data.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

// ---- OpenAI-compatible streaming ----
async function streamOpenAICompatible(
  apiUrl: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  opts: ByokStreamOptions,
  providerName: string,
): Promise<ByokStreamResult> {
  const startMs = performance.now();
  let ttftRecorded = false;

  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`${providerName} ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error(`No response body from ${providerName}`);

  const decoder = new TextDecoder();
  let content = '';
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const token = parseSseLine(line);
      if (token) {
        if (!ttftRecorded) {
          ttftRecorded = true;
          opts.onProviderInfo?.({ provider: providerName, model: body.model as string, ttftMs: performance.now() - startMs });
        }
        content += token;
        opts.onDelta?.(token, content);
      }
    }
  }

  return {
    content,
    provider: providerName,
    model: body.model as string,
    ttftMs: ttftRecorded ? performance.now() - startMs : undefined,
    totalMs: performance.now() - startMs,
  };
}

// ---- Anthropic Messages API streaming ----
async function streamAnthropic(
  apiUrl: string,
  headers: Record<string, string>,
  messages: { role: string; content: string }[],
  opts: ByokStreamOptions,
  model: string,
): Promise<ByokStreamResult> {
  const startMs = performance.now();
  let ttftRecorded = false;

  // Extract system message separately (Anthropic requirement)
  const systemMsg = opts.systemPrompt || messages.find(m => m.role === 'system')?.content || '';
  const chatMsgs = messages.filter(m => m.role !== 'system');

  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens || 8192,
      system: systemMsg,
      messages: chatMsgs,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Anthropic ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body from Anthropic');

  const decoder = new TextDecoder();
  let content = '';
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta' && data.delta?.text) {
          if (!ttftRecorded) {
            ttftRecorded = true;
            opts.onProviderInfo?.({ provider: 'Anthropic', model, ttftMs: performance.now() - startMs });
          }
          content += data.delta.text;
          opts.onDelta?.(data.delta.text, content);
        }
      } catch {
        // skip malformed SSE
      }
    }
  }

  return {
    content,
    provider: 'Anthropic',
    model,
    ttftMs: ttftRecorded ? performance.now() - startMs : undefined,
    totalMs: performance.now() - startMs,
  };
}

// ---- Main Entry Point ----

/**
 * Stream a chat completion using the user's BYOK key.
 * The key is decrypted from the encrypted vault, request goes
 * directly from browser to the provider.
 */
export async function byokChatStream(opts: ByokStreamOptions): Promise<ByokStreamResult> {
  const { providerId, messages, model, signal } = opts;
  const provider = getByokProvider(providerId);
  if (!provider) throw new Error(`Unknown BYOK provider: ${providerId}`);

  // Decrypt the user's key
  const apiKey = await decryptKey(providerId);
  if (!apiKey) throw new Error(`No key found for ${provider.name}. Please add your API key in settings.`);

  const resolvedModel = model || provider.defaultModel;

  // Anthropic uses a different API format
  if (provider.useAnthropicFormat) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    return streamAnthropic(provider.apiUrl, headers, messages, opts, resolvedModel);
  }

  // OpenAI-compatible format (covers Groq, Google, OpenAI, OpenRouter, DeepSeek, Together, Fireworks)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    ...provider.extraHeaders,
  };

  // Build messages array (prepend system prompt if provided)
  const allMessages = [...messages];
  if (opts.systemPrompt && !messages.some(m => m.role === 'system')) {
    allMessages.unshift({ role: 'system', content: opts.systemPrompt });
  }

  const body: Record<string, unknown> = {
    model: resolvedModel,
    messages: allMessages,
    max_tokens: opts.maxTokens || 4096,
    temperature: opts.temperature ?? 0.7,
    stream: true,
  };

  return streamOpenAICompatible(provider.apiUrl, headers, body, opts, provider.name);
}

/**
 * Non-streaming BYOK completion (simpler API for forge/execute).
 */
export async function byokChatComplete(
  providerId: ByokProviderId,
  systemPrompt: string,
  userContent: string,
  model?: string,
  signal?: AbortSignal,
): Promise<string> {
  const result = await byokChatStream({
    providerId,
    messages: [{ role: 'user', content: userContent }],
    model,
    systemPrompt,
    signal,
    maxTokens: 4096,
  });
  return result.content;
}

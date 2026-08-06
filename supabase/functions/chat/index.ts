/**
 * ShadowTalk AI — Hybrid Inference Chat Edge Function
 * 
 * Shared Free Pool with automatic fallback rotation:
 *   Primary:   Groq API (fastest, free tier)
 *   Secondary: Google AI Studio (Gemini)
 *   Fallback:  OpenRouter (free models)
 * 
 * Supports plan-based rate limiting, usage logging, and BYOK passthrough.
 * Uses OpenAI-compatible SSE streaming format across all providers.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { messagesPerDay: number; deepResearchPerDay: number; imagesPerDay: number }> = {
  free:     { messagesPerDay: 50,  deepResearchPerDay: 3,  imagesPerDay: 5 },
  pro:      { messagesPerDay: -1, deepResearchPerDay: 20, imagesPerDay: 20 },
  premium:  { messagesPerDay: -1, deepResearchPerDay: 50, imagesPerDay: 50 },
  elite:    { messagesPerDay: -1, deepResearchPerDay: -1, imagesPerDay: -1 },
};

// ============================================================
// Provider Definitions — Shared Free Pool
// ============================================================

interface ProviderConfig {
  id: string;
  name: string;
  /** True = this provider is available (has API key configured) */
  enabled: () => boolean;
  /** Map model name to provider-specific model ID */
  resolveModel: (model: string) => string;
  /** Build the API URL for chat completions */
  getUrl: () => string;
  /** Get the API key */
  getKey: () => string | undefined;
  /** Build provider-specific request headers */
  getHeaders: (apiKey: string) => Record<string, string>;
  /** Parse error message from failed response */
  parseError: (status: number, body: string) => string;
  /** Whether this error is rate-limit related (triggers fallback) */
  isRateLimit: (status: number, body: string) => boolean;
}

// --- Groq (Primary) ---
const groqProvider: ProviderConfig = {
  id: 'groq',
  name: 'Groq',
  enabled: () => !!Deno.env.get('GROQ_API_KEY'),
  resolveModel: (m) => {
    if (m.includes('llama')) return m;
    if (m.includes('mixtral')) return m;
    if (m.includes('gemma')) return m;
    return 'llama-3.3-70b-versatile';
  },
  getUrl: () => 'https://api.groq.com/openai/v1/chat/completions',
  getKey: () => Deno.env.get('GROQ_API_KEY'),
  getHeaders: (k) => ({
    'Authorization': `Bearer ${k}`,
    'Content-Type': 'application/json',
  }),
  parseError: (s, b) => `Groq ${s}: ${b.slice(0, 200)}`,
  isRateLimit: (s, b) => s === 429 || b.includes('rate_limit') || b.includes('too many requests'),
};

// --- Google AI Studio (Secondary) ---
const googleProvider: ProviderConfig = {
  id: 'google',
  name: 'Google AI Studio',
  enabled: () => !!Deno.env.get('GEMINI_API_KEY'),
  resolveModel: (m) => {
    const cleaned = m.replace('google/', '').replace('gemini-', 'gemini-');
    return cleaned || 'gemini-2.0-flash';
  },
  getUrl: () => 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  getKey: () => Deno.env.get('GEMINI_API_KEY'),
  getHeaders: (k) => ({
    'Authorization': `Bearer ${k}`,
    'Content-Type': 'application/json',
  }),
  parseError: (s, b) => `Google AI ${s}: ${b.slice(0, 200)}`,
  isRateLimit: (s, b) => s === 429 || b.includes('RESOURCE_EXHAUSTED') || b.includes('quota'),
};

// --- OpenRouter (Fallback) ---
const openrouterProvider: ProviderConfig = {
  id: 'openrouter',
  name: 'OpenRouter',
  enabled: () => !!Deno.env.get('OPENROUTER_API_KEY'),
  resolveModel: (m) => {
    if (m.includes('/')) return m; // already has org/model format
    return `google/${m}` || 'google/gemini-2.0-flash-exp:free';
  },
  getUrl: () => 'https://openrouter.ai/api/v1/chat/completions',
  getKey: () => Deno.env.get('OPENROUTER_API_KEY'),
  getHeaders: (k) => ({
    'Authorization': `Bearer ${k}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://shadowtalk.app',
    'X-Title': 'ShadowTalk AI',
  }),
  parseError: (s, b) => `OpenRouter ${s}: ${b.slice(0, 200)}`,
  isRateLimit: (s, b) => s === 429 || b.includes('rate_limit') || b.includes('insufficient credits'),
};

// Provider chain: tried in order until one succeeds
const SHARED_POOL: ProviderConfig[] = [groqProvider, googleProvider, openrouterProvider];

// ============================================================
// Request Handler
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Authenticate user (skip for BYOK passthrough — they send their own key)
    const authHeader = req.headers.get('Authorization') || '';
    let user: { id: string; email?: string } | null = null;
    let isByokPassthrough = false;

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (!authError && authUser) {
      user = { id: authUser.id, email: authUser.email || undefined };
    }

    const body = await req.json();
    const {
      messages,
      model,
      mode,
      stream = true,
      personality,
      webSearch,
      deepResearch,
      // BYOK passthrough fields — when set, requests go directly using the user's key
      byokProvider,
      byokApiKey,
    } = body;

    // ---- BYOK Passthrough Mode ----
    // When a user provides their own key, route directly to that provider.
    // This costs $0 from the shared pool and bypasses rate limits.
    if (byokProvider && byokApiKey) {
      isByokPassthrough = true;
      return handleByokRequest({ byokProvider, byokApiKey, messages, model, stream, personality, deepResearch });
    }

    // ---- Auth required for shared pool ----
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Sign in or use BYOK mode.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.plan || 'free';
    const limits = PLANS[plan] || PLANS.free;

    // Check daily usage limits for free/pro plans
    if (limits.messagesPerDay > 0) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('daily_usage')
        .select('messages, deep_research')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();

      if (usage && deepResearch && limits.deepResearchPerDay > 0 && usage.deep_research >= limits.deepResearchPerDay) {
        return new Response(
          JSON.stringify({ error: 'Daily deep research limit reached. Upgrade for more.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (usage && usage.messages >= limits.messagesPerDay) {
        return new Response(
          JSON.stringify({ error: 'Daily message limit reached. Upgrade for unlimited.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build system prompt with personality
    const systemPrompts: string[] = [
      'You are ShadowTalk AI, a powerful and private AI assistant. Be helpful, accurate, and concise.',
    ];
    if (personality && personality !== 'default') {
      systemPrompts.push(`Personality mode: ${personality}`);
    }
    if (deepResearch) {
      systemPrompts.push('The user has requested deep research. Provide thorough, well-structured analysis with citations where possible.');
    }

    const chatMessages = [
      { role: 'system', content: systemPrompts.join('\n\n') },
      ...messages,
    ];

    // ---- Shared Free Pool: Try providers in order ----
    let lastError = '';
    const requestedModel = model || 'llama-3.3-70b-versatile';

    for (const provider of SHARED_POOL) {
      if (!provider.enabled()) continue;

      const resolvedModel = provider.resolveModel(requestedModel);
      const apiKey = provider.getKey();
      if (!apiKey) continue;

      try {
        const providerResponse = await fetch(provider.getUrl(), {
          method: 'POST',
          headers: provider.getHeaders(apiKey),
          body: JSON.stringify({
            model: resolvedModel,
            messages: chatMessages,
            stream,
            max_tokens: deepResearch ? 8192 : 4096,
          }),
        });

        if (!providerResponse.ok) {
          const errText = await providerResponse.text();
          const errMsg = provider.parseError(providerResponse.status, errText);
          console.warn(`[SharedPool] ${provider.name} error:`, errMsg);
          lastError = errMsg;

          // If rate limited, try next provider
          if (provider.isRateLimit(providerResponse.status, errText)) {
            console.log(`[SharedPool] ${provider.name} rate limited, falling back...`);
            continue;
          }
          // Non-rate-limit error — still try fallback
          continue;
        }

        // Success! Log usage and stream back
        console.log(`[SharedPool] Using ${provider.name} for model ${resolvedModel}`);

        // Log usage (fire and forget)
        supabase.from('usage_analytics').insert({
          user_id: user!.id,
          action_type: deepResearch ? 'deep_research' : 'chat_message',
          feature_used: `${provider.id}:${resolvedModel}`,
        }).then(() => {});

        // Increment daily usage
        const today = new Date().toISOString().split('T')[0];
        supabase.from('daily_usage').upsert({
          user_id: user!.id,
          usage_date: today,
          messages: 1,
          deep_research: deepResearch ? 1 : 0,
        }, { onConflict: 'user_id,usage_date' }).then(() => {});

        // Stream back to client with provider info header
        if (stream) {
          return new Response(providerResponse.body, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'X-Provider': provider.id,
              'X-Model': resolvedModel,
            },
          });
        }

        const data = await providerResponse.json();
        return new Response(JSON.stringify({ ...data, _provider: provider.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err) {
        console.warn(`[SharedPool] ${provider.name} exception:`, err);
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }

    // All providers failed
    return new Response(
      JSON.stringify({ error: `All providers exhausted. ${lastError}` }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Chat function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================
// BYOK Passthrough Handler
// ============================================================

/**
 * When users bring their own key, route directly to their chosen provider.
 * No rate limiting, no usage counting — costs $0 from shared pool.
 */
async function handleByokRequest(opts: {
  byokProvider: string;
  byokApiKey: string;
  messages: any[];
  model?: string;
  stream?: boolean;
  personality?: string;
  deepResearch?: boolean;
}): Promise<Response> {
  const { byokProvider, byokApiKey, messages, model, stream = true, personality, deepResearch } = opts;

  // Build provider config from BYOK input
  let apiUrl: string;
  let resolvedModel: string;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${byokApiKey}`,
  };

  switch (byokProvider) {
    case 'groq':
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      resolvedModel = model || 'llama-3.3-70b-versatile';
      break;
    case 'google':
    case 'gemini':
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      resolvedModel = model?.replace('google/', '') || 'gemini-2.0-flash';
      break;
    case 'openai':
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      resolvedModel = model || 'gpt-4o-mini';
      break;
    case 'anthropic':
      // Anthropic uses a different API format — return error for now
      return new Response(
        JSON.stringify({ error: 'Anthropic BYOK is supported via client-side direct calls only.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    case 'openrouter':
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      resolvedModel = model || 'openai/gpt-4o-mini';
      headers['HTTP-Referer'] = 'https://shadowtalk.app';
      headers['X-Title'] = 'ShadowTalk AI (BYOK)';
      break;
    default:
      // Assume OpenAI-compatible endpoint
      apiUrl = byokProvider.startsWith('http') ? byokProvider : `https://api.${byokProvider}.com/v1/chat/completions`;
      resolvedModel = model || 'default';
  }

  const systemPrompts: string[] = [
    'You are ShadowTalk AI, a powerful and private AI assistant. Be helpful, accurate, and concise.',
  ];
  if (personality && personality !== 'default') systemPrompts.push(`Personality mode: ${personality}`);
  if (deepResearch) systemPrompts.push('The user has requested deep research. Provide thorough, well-structured analysis with citations where possible.');

  const chatMessages = [
    { role: 'system', content: systemPrompts.join('\n\n') },
    ...messages,
  ];

  try {
    const providerResponse = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: resolvedModel,
        messages: chatMessages,
        stream,
        max_tokens: deepResearch ? 8192 : 4096,
      }),
    });

    if (!providerResponse.ok) {
      const errText = await providerResponse.text();
      return new Response(
        JSON.stringify({ error: `BYOK provider error: ${providerResponse.status} — ${errText.slice(0, 300)}` }),
        { status: providerResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stream) {
      return new Response(providerResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Provider': `byok-${byokProvider}`,
          'X-Model': resolvedModel,
        },
      });
    }

    const data = await providerResponse.json();
    return new Response(JSON.stringify({ ...data, _provider: `byok-${byokProvider}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `BYOK request failed: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

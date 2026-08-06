/**
 * ShadowTalk AI — Chat Edge Function
 * 
 * Proxies chat requests to AI providers (Gemini, OpenAI, Groq, Ollama)
 * with credit tracking, rate limiting, and usage logging.
 * 
 * Uses OpenAI-compatible SSE streaming format.
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

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { messages, model, mode, stream = true, personality, webSearch, deepResearch } = body;

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

    // Determine AI provider and API key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

    let apiUrl: string;
    let apiKey: string;
    let modelId = model || 'google/gemini-2.5-flash';

    if (modelId.includes('gemini') || modelId.includes('google')) {
      // Use Gemini via OpenAI-compatible endpoint
      if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'Gemini API not configured' }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      apiKey = GEMINI_API_KEY;
    } else if (modelId.includes('gpt') || modelId.includes('openai')) {
      if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'OpenAI API not configured' }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = OPENAI_API_KEY;
    } else {
      // Default to Groq
      if (!GROQ_API_KEY) {
        return new Response(JSON.stringify({ error: 'No AI provider configured' }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      apiKey = GROQ_API_KEY;
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

    // Stream response from AI provider
    const providerResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId.replace('google/', '').replace('openai/', ''),
        messages: chatMessages,
        stream,
        max_tokens: deepResearch ? 8192 : 4096,
      }),
    });

    if (!providerResponse.ok) {
      const errText = await providerResponse.text();
      console.error(`AI provider error ${providerResponse.status}:`, errText);
      return new Response(
        JSON.stringify({ error: `AI provider error: ${providerResponse.status}` }),
        { status: providerResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log usage (fire and forget)
    supabase.from('usage_analytics').insert({
      user_id: user.id,
      action_type: deepResearch ? 'deep_research' : 'chat_message',
      feature_used: modelId,
    }).then(() => {});

    // Increment daily usage
    const today = new Date().toISOString().split('T')[0];
    supabase.from('daily_usage').upsert({
      user_id: user.id,
      usage_date: today,
      messages: 1,
      deep_research: deepResearch ? 1 : 0,
    }, { onConflict: 'user_id,usage_date' }).then(() => {});

    // Stream back to client
    if (stream) {
      return new Response(providerResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const data = await providerResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Chat function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const DEFAULT_MODEL = 'google/gemini-3.7-flash';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI is not configured (missing LOVABLE_API_KEY).' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    for (const m of messages) {
      if (
        !m || typeof m.content !== 'string' ||
        !['system', 'user', 'assistant'].includes(m.role)
      ) {
        return new Response(JSON.stringify({ error: 'invalid message shape' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const model = typeof body?.model === 'string' && body.model ? body.model : DEFAULT_MODEL;

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        ...(typeof body?.temperature === 'number' ? { temperature: body.temperature } : {}),
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      let message = text.slice(0, 500) || 'AI gateway request failed';
      try {
        const parsed = JSON.parse(text);
        message = parsed?.error?.message ?? parsed?.message ?? message;
      } catch { /* keep raw text */ }
      return new Response(JSON.stringify({ error: message }), {
        status: upstream.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

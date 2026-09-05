import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const DEFAULT_MODEL = 'google/gemini-3-pro-image';
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/images/generations';

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
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const model = typeof body?.model === 'string' && body.model ? body.model : DEFAULT_MODEL;
    const stream = body?.stream !== false;
    const referenceImage = typeof body?.referenceImage === 'string' ? body.referenceImage : '';

    const content: unknown[] = [{ type: 'text', text: prompt }];
    if (referenceImage) {
      content.push({ type: 'image_url', image_url: { url: referenceImage } });
    }

    const upstream = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: referenceImage ? content : prompt }],
        modalities: ['image', 'text'],
        ...(stream ? { stream: true } : {}),
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      let message = text.slice(0, 500) || 'Image generation failed';
      try {
        const parsed = JSON.parse(text);
        message = parsed?.error?.message ?? parsed?.message ?? message;
      } catch { /* keep raw text */ }
      return new Response(JSON.stringify({ error: message }), {
        status: upstream.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!stream) {
      const json = await upstream.text();
      return new Response(json, {
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

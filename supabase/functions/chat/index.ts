import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const DEFAULT_MODEL = 'openai/gpt-5.6-sol';
const OPENAI_MODEL = 'gpt-4o-mini';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

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
    const messages = body?.messages as Msg[] | undefined;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    for (const m of messages) {
      if (!m || typeof m.content !== 'string' || !['system', 'user', 'assistant'].includes(m.role)) {
        return new Response(JSON.stringify({ error: 'invalid message shape' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const model = typeof body?.model === 'string' && body.model ? body.model : DEFAULT_MODEL;

    // ---- Fast path: Groq (BYOK server-side). Already speaks chat-completions SSE. ----
    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (groqKey) {
      try {
        const groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            stream: true,
            temperature: typeof body?.temperature === 'number' ? body.temperature : 0.7,
          }),
        });

        if (groq.ok && groq.body) {
          return new Response(groq.body, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
        const errText = await groq.text().catch(() => '');
        console.error('[chat] Groq failed, falling back to Lovable AI:', groq.status, errText.slice(0, 300));
      } catch (err) {
        console.error('[chat] Groq error, falling back to Lovable AI:', err);
      }
    }



    // Responses API input items (assistant turns use output_text parts).
    const input = messages.map((m) => ({
      role: m.role,
      content: [{ type: m.role === 'assistant' ? 'output_text' : 'input_text', text: m.content }],
    }));

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model,
        input,
        stream: true,
        store: false,
        // Latency-optimized: minimal thinking + priority serving tier.
        reasoning: { effort: 'low' },
        service_tier: 'priority',
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

    // Translate Responses SSE -> chat-completions delta SSE so clients stay unchanged.
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 1);
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const evt = JSON.parse(payload);
                if (evt?.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ choices: [{ delta: { content: evt.delta } }] })}\n\n`,
                    ),
                  );
                }
              } catch { /* partial JSON — next chunk completes it */ }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
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

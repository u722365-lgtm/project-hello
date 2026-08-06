/**
 * ShadowTalk AI — ElevenLabs TTS Edge Function
 * 
 * Proxies text-to-speech requests to ElevenLabs.
 * API key is stored server-side (never exposed to client).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, voice_id = 'pNInz6obpgDQGcFmaJgB', model_id = 'eleven_multilingual_v2' } = await req.json();

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('ElevenLabs error:', err);
      return new Response(
        JSON.stringify({ error: 'TTS generation failed' }),
        { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream audio back
    return new Response(resp.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('TTS error:', err);
    return new Response(
      JSON.stringify({ error: 'TTS failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

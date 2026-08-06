/**
 * ShadowTalk AI — Vision Analyze Edge Function
 * 
 * Analyzes images using Gemini Vision API.
 * Set GEMINI_API_KEY in Supabase secrets.
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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Vision API not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image_data, image_mime_type, prompt = 'Describe this image in detail.' } = await req.json();

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: image_mime_type || 'image/png', data: image_data } },
            ],
          }],
        }),
      }
    );

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No description generated.';

    return new Response(
      JSON.stringify({ description: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Vision analyze error:', err);
    return new Response(
      JSON.stringify({ error: 'Vision analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

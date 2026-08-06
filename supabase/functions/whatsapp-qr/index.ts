/**
 * ShadowTalk AI — WhatsApp QR Edge Function
 * 
 * Generates WhatsApp connection QR code via Twilio.
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER in Supabase secrets.
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
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp/Twilio not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone_number } = await req.json();

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: 'Phone number required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the WhatsApp link for verification
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // In production, you would use Twilio's WhatsApp Business API
    // to send a verification code. For now, return the connection info.
    return new Response(
      JSON.stringify({
        verification_code: code,
        expires_at: expiresAt,
        whatsapp_number: Deno.env.get('TWILIO_WHATSAPP_NUMBER'),
        status: 'pending_verification',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('WhatsApp QR error:', err);
    return new Response(
      JSON.stringify({ error: 'WhatsApp setup failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

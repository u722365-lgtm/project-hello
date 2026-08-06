/**
 * ShadowTalk AI — LemonSqueezy Checkout Edge Function
 * 
 * Creates a LemonSqueezy checkout URL for the selected plan.
 * Set LEMONSQUEEZY_API_KEY in Supabase secrets.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_VARIANTS: Record<string, string> = {
  pro: Deno.env.get('LEMONSQUEEZY_VARIANT_PRO') || '',
  premium: Deno.env.get('LEMONSQUEEZY_VARIANT_PREMIUM') || '',
  elite: Deno.env.get('LEMONSQUEEZY_VARIANT_ELITE') || '',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan } = await req.json();
    const variantId = PLAN_VARIANTS[plan];

    if (!variantId) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LEMONSQUEEZY_API_KEY = Deno.env.get('LEMONSQUEEZY_API_KEY');
    if (!LEMONSQUEEZY_API_KEY) {
      return new Response(JSON.stringify({ error: 'Payment not configured' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create checkout with LemonSqueezy API
    const resp = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            variant_id: parseInt(variantId),
            checkout_data: {
              email: user.email,
              custom: { user_id: user.id },
            },
          },
        },
      }),
    });

    const data = await resp.json();
    const checkoutUrl = data?.data?.attributes?.url;

    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: 'Checkout creation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ url: checkoutUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('LemonSqueezy error:', err);
    return new Response(
      JSON.stringify({ error: 'Checkout failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

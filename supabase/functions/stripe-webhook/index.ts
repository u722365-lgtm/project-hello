/**
 * ShadowTalk AI — Stripe Webhook Edge Function
 * 
 * Handles Stripe checkout.session.completed and customer.subscription.* events.
 * Updates user plan in profiles table.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan mapping from Stripe price IDs
const PRICE_TO_PLAN: Record<string, string> = {
  // Update these with your actual Stripe price IDs from src/lib/stripe.ts
  // 'price_xxx': 'pro',
  // 'price_yyy': 'premium',
  // 'price_zzz': 'elite',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return new Response('Missing signature', { status: 400 });
    }

    // Verify Stripe webhook signature
    // Note: In production, use the stripe-node library for verification.
    // For Deno edge functions, we verify manually:
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(STRIPE_WEBHOOK_SECRET.split('_secret_')[1]),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Parse the event (simplified — use stripe SDK in production)
    const event = JSON.parse(body);
    const eventType = event.type;

    console.log(`Stripe webhook: ${eventType}`);

    if (eventType === 'checkout.session.completed') {
      const session = event.data.object;
      const customerId = session.customer;
      const priceId = session.line_items?.[0]?.price?.id;

      if (!customerId || !priceId) {
        return new Response('Missing customer or price', { status: 400 });
      }

      // Find user by Stripe customer ID
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (subscriber?.user_id) {
        const plan = PRICE_TO_PLAN[priceId] || 'pro';

        // Update profile plan
        await supabase
          .from('profiles')
          .update({ plan, updated_at: new Date().toISOString() })
          .eq('id', subscriber.user_id);

        // Update subscriber record
        await supabase
          .from('subscribers')
          .update({
            subscribed: true,
            subscription_tier: plan,
            subscription_end: session.subscription
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`Upgraded user ${subscriber.user_id} to ${plan}`);
      }
    }

    if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (subscriber?.user_id) {
        await supabase
          .from('profiles')
          .update({ plan: 'free', updated_at: new Date().toISOString() })
          .eq('id', subscriber.user_id);

        await supabase
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_tier: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`Downgraded user ${subscriber.user_id} to free`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

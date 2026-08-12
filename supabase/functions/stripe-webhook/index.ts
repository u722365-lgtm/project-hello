/**
 * ShadowTalk AI — Stripe Webhook Edge Function
 *
 * Handles Stripe checkout.session.completed and customer.subscription.* events.
 * Updates user plan in profiles table.
 *
 * SECURITY: Verifies the Stripe webhook signature using HMAC-SHA256 before
 * processing any event. Without this, anyone could forge events to grant
 * themselves premium plans.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Plan mapping from Stripe price IDs.
 * TODO: Replace placeholder IDs with real Stripe price IDs from your Stripe dashboard.
 */
const PRICE_TO_PLAN: Record<string, string> = {
  // 'price_1XXXX': 'pro',
  // 'price_1XXXX': 'premium',
  // 'price_1XXXX': 'elite',
};

/** Supported Stripe plans (used as fallback guard). */
const VALID_PLANS = new Set(['free', 'pro', 'premium', 'elite', 'lifetime', 'enterprise']);

/**
 * Verify the Stripe webhook signature using HMAC-SHA256.
 * Stripe signs each webhook with a secret; we recompute the signature
 * over the raw body and compare.
 *
 * @returns The parsed event if valid, or null if verification fails.
 */
async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  // Stripe signature format: t=timestamp,v1=hexdigest
  const parts = signature.split(',');
  let timestamp = '';
  let expectedSig = '';
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 't') timestamp = v;
    if (k === 'v1') expectedSig = v;
  }
  if (!timestamp || !expectedSig) {
    console.error('Stripe webhook: malformed signature header');
    return null;
  }

  const signedPayload = `${timestamp}.${body}`;
  const sigBuffer = encoder.encode(expectedSig);
  const dataBuffer = encoder.encode(signedPayload);

  const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, dataBuffer);
  if (!isValid) {
    console.error('Stripe webhook: signature verification failed');
    return null;
  }

  return JSON.parse(body) as Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return new Response('Missing signature or secret', { status: 400 });
    }

    // Verify signature — reject forged events
    const event = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET);
    if (!event) {
      return new Response('Invalid signature', { status: 401 });
    }

    const eventType = event.type as string;
    const eventData = event.data?.object as Record<string, any> | undefined;

    console.log(`Stripe webhook: ${eventType}`);

    if (eventType === 'checkout.session.completed' && eventData) {
      const customerId = eventData.customer as string | undefined;
      const lineItems = eventData.line_items as Array<{ price?: { id?: string } }> | undefined;
      const priceId = lineItems?.[0]?.price?.id;

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

        if (!VALID_PLANS.has(plan)) {
          console.error(`Stripe webhook: unknown plan "${plan}" from price ${priceId}`);
          return new Response('Unknown plan', { status: 400 });
        }

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
            subscription_end: eventData.subscription
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`Upgraded user ${subscriber.user_id} to ${plan}`);
      }
    }

    if (eventType === 'customer.subscription.deleted' && eventData) {
      const customerId = eventData.customer as string | undefined;

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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

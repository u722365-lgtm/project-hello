import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAID_PLANS = new Set(["pro", "premium", "elite", "enterprise"]);

async function isAdmin(req: Request): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth || !supabaseUrl || !anonKey) return null;
  const anon = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
  const token = auth.replace("Bearer ", "");
  const { data: claimsData } = await anon.auth.getClaims(token);
  const uid = claimsData?.claims?.sub;
  if (!uid) return null;
  const { data: roleRow } = await anon.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return roleRow ? uid : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const adminId = await isAdmin(req);
  if (!adminId) {
    return new Response(JSON.stringify({ ok: false, error: "Admin only" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { paymentId, action, notes } = await req.json();
    if (!paymentId || !["verify", "reject"].includes(action)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: payment, error: fetchErr } = await admin
      .from("manual_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (fetchErr || !payment) {
      return new Response(JSON.stringify({ ok: false, error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await admin.from("manual_payments").update({
        status: "rejected",
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        notes: notes ?? null,
      }).eq("id", paymentId);
      return new Response(JSON.stringify({ ok: true, status: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId = payment.user_id as string | null;
    if (!userId && payment.email) {
      const { data: profile } = await admin.from("profiles").select("id").eq("email", payment.email).maybeSingle();
      userId = profile?.id ?? null;
    }

    const plan = String(payment.plan_type ?? "pro");
    const tier = PAID_PLANS.has(plan) ? plan : "pro";
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 32);

    if (userId) {
      await admin.from("subscribers").upsert(
        {
          user_id: userId,
          email: payment.email,
          subscribed: true,
          subscription_tier: tier,
          subscription_status: "active",
          subscription_end: subscriptionEnd.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      await admin.from("user_notifications").insert({
        user_id: userId,
        title: `${tier.charAt(0).toUpperCase() + tier.slice(1)} plan activated`,
        message: "Your payment was verified. Welcome to ShadowTalk Pro — enjoy unlimited access.",
        type: "billing",
        action_url: "/chatbot",
        metadata: { payment_id: paymentId, plan: tier },
      });
    }

    await admin.from("manual_payments").update({
      status: "verified",
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      notes: notes ?? null,
      user_id: userId ?? payment.user_id,
    }).eq("id", paymentId);

    return new Response(
      JSON.stringify({ ok: true, status: "verified", userId, plan: tier }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

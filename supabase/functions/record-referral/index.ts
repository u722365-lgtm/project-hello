import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const auth = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { referral_code } = await req.json();
    if (!referral_code || typeof referral_code !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "referral_code required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const admin = createClient(supabaseUrl, serviceRole);

    const { data: existing } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, already: true }), { headers: corsHeaders });
    }

    const { data: referrerCode } = await admin
      .from("user_referral_codes")
      .select("user_id, referral_code, total_referrals")
      .eq("referral_code", referral_code.trim())
      .maybeSingle();

    if (!referrerCode || referrerCode.user_id === user.id) {
      return new Response(JSON.stringify({ ok: false, error: "invalid code" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const rowCode = `${referral_code}_${user.id.slice(0, 8)}`;
    const { error: insErr } = await admin.from("referrals").insert({
      referrer_id: referrerCode.user_id,
      referred_email: user.email ?? "unknown",
      referred_user_id: user.id,
      referral_code: rowCode,
      status: "signed_up",
    });

    if (insErr) {
      return new Response(JSON.stringify({ ok: false, error: insErr.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    await admin
      .from("user_referral_codes")
      .update({ total_referrals: (referrerCode.total_referrals ?? 0) + 1 })
      .eq("user_id", referrerCode.user_id);

    return new Response(JSON.stringify({ ok: true, attributed: true }), { headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

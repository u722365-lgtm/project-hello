import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, service: "shadow-heal-watchdog", version: 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ ok: false, warning: "storage not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const admin = createClient(supabaseUrl, serviceRole);

    // Re-queue stale open errors for re-analysis (server-side 24/7 loop when clients heartbeat)
    const { data: stale } = await admin
      .from("shadowtalk_errors")
      .select("id, fingerprint, message, kind")
      .in("status", ["open", "failed", "analyzing"])
      .order("last_seen_at", { ascending: false })
      .limit(5);

    let requeued = 0;
    for (const err of stale ?? []) {
      await admin
        .from("shadowtalk_errors")
        .update({ status: "open", updated_at: new Date().toISOString() })
        .eq("id", err.id);
      requeued += 1;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        received: body,
        requeued_errors: requeued,
        ts: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

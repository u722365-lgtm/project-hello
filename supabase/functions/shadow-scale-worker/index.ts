import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (!serviceRole || auth !== serviceRole) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: actions } = await admin
      .from("shadowscale_action_queue")
      .select("*")
      .eq("status", "approved")
      .order("priority", { ascending: false })
      .limit(10);

    const results: { id: string; ok: boolean; detail?: string }[] = [];

    for (const action of actions ?? []) {
      await admin.from("shadowscale_action_queue").update({ status: "running" }).eq("id", action.id);

      try {
        let result: Record<string, unknown> = {};

        if (action.action_type === "changelog_nudge") {
          const p = action.payload as { title?: string; version?: string };
          const { data: ann } = await admin.from("announcements").insert({
            title: p.title ?? "What's new",
            message: `ShadowTalk ${p.version ?? ""} is live — see the changelog for details.`,
            type: "success",
            is_active: true,
          }).select().single();
          result = { announcement_id: ann?.id };
        } else if (action.action_type === "referral_campaign") {
          result = { queued_notification: true, payload: action.payload };
        } else if (action.action_type === "share_campaign") {
          result = { note: "Share campaign flagged for client-side amplification", payload: action.payload };
        } else if (action.action_type === "in_app_announcement_draft") {
          result = { draft: action.payload };
        } else if (action.action_type === "publish_blog") {
          const blogRes = await fetch(`${supabaseUrl}/functions/v1/generate-blog`, {
            method: "POST",
            headers: { Authorization: `Bearer ${serviceRole}`, "Content-Type": "application/json" },
            body: JSON.stringify(action.payload ?? {}),
          });
          result = await blogRes.json().catch(() => ({}));
        } else {
          result = { skipped: true, reason: "unknown action type" };
        }

        await admin.from("shadowscale_action_queue").update({
          status: "done",
          result,
        }).eq("id", action.id);
        results.push({ id: action.id, ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await admin.from("shadowscale_action_queue").update({
          status: "failed",
          result: { error: msg },
        }).eq("id", action.id);
        results.push({ id: action.id, ok: false, detail: msg });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

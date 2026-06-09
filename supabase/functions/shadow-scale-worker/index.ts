import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { canPostAnnouncement, ethicalCopy, type ScaleConfig } from "../_shared/shadowscalePolicy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function isAuthorized(req: Request): Promise<boolean> {
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (serviceRole && auth === serviceRole) return true;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader || !supabaseUrl || !anonKey) return false;
  const anon = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData } = await anon.auth.getClaims(token);
  const uid = claimsData?.claims?.sub;
  if (!uid) return false;
  const { data: roleRow } = await anon.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return Boolean(roleRow);
}

async function setClientSignals(
  admin: ReturnType<typeof createClient>,
  patch: Record<string, unknown>,
) {
  await admin.from("shadowscale_client_signals").upsert({
    id: 1,
    ...patch,
    updated_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!(await isAuthorized(req))) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const internalCron = Deno.env.get("INTERNAL_CRON_SECRET") ?? "";
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: config } = await admin.from("shadowscale_config").select("*").limit(1).maybeSingle();
    const ethical = (config as ScaleConfig | null)?.ethical_mode !== false;

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
          if (!(await canPostAnnouncement(config as ScaleConfig, admin))) {
            throw new Error("Daily announcement limit reached");
          }
          const p = action.payload as { title?: string; version?: string };
          const title = ethicalCopy(p.title ?? "What's new", ethical);
          const { data: ann } = await admin.from("announcements").insert({
            title,
            message: ethicalCopy(
              `ShadowTalk ${p.version ?? ""} is live — see the changelog for details.`,
              ethical,
            ),
            type: "success",
            is_active: true,
          }).select().single();
          result = { announcement_id: ann?.id };
        } else if (action.action_type === "referral_campaign") {
          const p = action.payload as { user_id?: string; message?: string; referral_code?: string };
          if (!p.user_id) throw new Error("Missing user_id");
          const msg = ethicalCopy(p.message ?? "Share your referral link for bonus credits", ethical);
          const { data: notif } = await admin.from("user_notifications").insert({
            user_id: p.user_id,
            title: "Referral boost unlocked",
            message: msg,
            type: "growth",
            action_url: "/referral",
            metadata: { referral_code: p.referral_code, source: "shadowscale" },
          }).select().single();
          result = { notification_id: notif?.id };
        } else if (action.action_type === "share_campaign") {
          const p = action.payload as { message?: string };
          const until = new Date(Date.now() + 7 * 86400000).toISOString();
          const msg = ethicalCopy(p.message ?? "Share ShadowTalk after your next win", ethical);
          await setClientSignals(admin, {
            amplify_shares: true,
            amplify_shares_until: until,
            campaign_message: msg,
          });
          if (await canPostAnnouncement(config as ScaleConfig, admin)) {
            const { data: ann } = await admin.from("announcements").insert({
              title: "Growth mode: share prompts active",
              message: msg,
              type: "info",
              is_active: true,
            }).select().single();
            result = { amplify_until: until, announcement_id: ann?.id };
          } else {
            result = { amplify_until: until, announcement_skipped: true };
          }
        } else if (action.action_type === "video_studio_promo") {
          const p = action.payload as { message?: string; path?: string };
          await setClientSignals(admin, {
            promote_video_studio: true,
            campaign_message: ethicalCopy(p.message ?? "Try Video Studio", ethical),
          });
          if (await canPostAnnouncement(config as ScaleConfig, admin)) {
            const { data: ann } = await admin.from("announcements").insert({
              title: "New: Shadow Video Studio",
              message: ethicalCopy(
                p.message ?? "Pro users can generate viral shorts in-browser — no API key.",
                ethical,
              ),
              type: "info",
              is_active: true,
            }).select().single();
            result = { promote_video_studio: true, announcement_id: ann?.id, path: p.path ?? "/video-studio" };
          } else {
            result = { promote_video_studio: true };
          }
        } else if (action.action_type === "re_engagement_nudge") {
          const p = action.payload as { message?: string };
          if (await canPostAnnouncement(config as ScaleConfig, admin)) {
            const { data: ann } = await admin.from("announcements").insert({
              title: "Welcome back to ShadowTalk",
              message: ethicalCopy(p.message ?? "See what's new in the changelog", ethical),
              type: "info",
              is_active: true,
            }).select().single();
            result = { announcement_id: ann?.id };
          } else {
            result = { skipped: true, reason: "announcement cap" };
          }
        } else if (action.action_type === "in_app_announcement_draft") {
          result = { draft: action.payload };
        } else if (action.action_type === "publish_blog") {
          const blogRes = await fetch(`${supabaseUrl}/functions/v1/generate-blog`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(internalCron ? { "x-internal-cron-secret": internalCron } : {}),
            },
            body: JSON.stringify(action.payload ?? {}),
          });
          result = await blogRes.json().catch(() => ({ ok: blogRes.ok }));
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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { LOW_RISK_ACTIONS, type ScaleConfig } from "../_shared/shadowscalePolicy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

async function isCronOrService(req: Request): Promise<boolean> {
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const headerSecret = req.headers.get("x-cron-secret") ?? "";
  if (serviceRole && auth === serviceRole) return true;
  if (cronSecret && headerSecret === cronSecret) return true;
  return false;
}

async function isAdminJwt(req: Request): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth || !supabaseUrl || !anonKey) return false;
  const anon = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
  const token = auth.replace("Bearer ", "");
  const { data: claimsData } = await anon.auth.getClaims(token);
  const uid = claimsData?.claims?.sub;
  if (!uid) return false;
  const { data: roleRow } = await anon.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return Boolean(roleRow);
}

async function invokeWorker(supabaseUrl: string, serviceRole: string) {
  await fetch(`${supabaseUrl}/functions/v1/shadow-scale-worker`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trigger: "orchestrator" }),
  }).catch(() => null);
}

type AdminClient = ReturnType<typeof createClient>;

async function snapshotMetrics(admin: AdminClient) {
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = `${today}T00:00:00.000Z`;

  const [
    { count: signupsToday },
    { count: convToday },
    { count: referrals },
    { count: conversions },
    { data: heartbeats },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    admin.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    admin.from("referrals").select("id", { count: "exact", head: true }),
    admin.from("referrals").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    admin.from("shadowscale_heartbeats").select("events").gte("created_at", dayStart).limit(500),
  ]);

  let shares = 0;
  let milestones = 0;
  for (const hb of heartbeats ?? []) {
    const events = (hb.events ?? []) as { type?: string }[];
    for (const ev of events) {
      if (ev.type === "share") shares++;
      if (ev.type === "session_milestone") milestones++;
    }
  }

  const metrics = {
    signups: signupsToday ?? 0,
    active_users: convToday ?? 0,
    shares,
    referrals: referrals ?? 0,
    conversions: conversions ?? 0,
    extra: { milestones },
  };

  await admin.from("shadowscale_metrics_daily").upsert(
    { metric_date: today, ...metrics },
    { onConflict: "metric_date" },
  );

  return metrics;
}

async function runPlaybooks(
  admin: AdminClient,
  metrics: { signups: number; active_users: number; shares: number; referrals: number; conversions: number },
  config: ScaleConfig | null,
) {
  const queued: string[] = [];
  const ethical = config?.ethical_mode !== false;
  const autopilot = config?.autopilot ?? false;

  const { data: recentChangelog } = await admin
    .from("changelog_entries")
    .select("id, title, version")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentChangelog) {
    const { data: existing } = await admin
      .from("shadowscale_action_queue")
      .select("id")
      .eq("action_type", "changelog_nudge")
      .contains("payload", { changelog_id: recentChangelog.id })
      .maybeSingle();

    if (!existing) {
      await admin.from("shadowscale_action_queue").insert({
        action_type: "changelog_nudge",
        payload: {
          changelog_id: recentChangelog.id,
          title: recentChangelog.title,
          version: recentChangelog.version,
        },
        priority: 70,
        confidence: 0.8,
        status: "approved",
        created_by: "orchestrator",
      });
      queued.push("changelog_nudge");
    }
  }

  const { data: powerReferrers } = await admin
    .from("user_referral_codes")
    .select("user_id, referral_code, total_referrals")
    .gte("total_referrals", 1)
    .order("total_referrals", { ascending: false })
    .limit(5);

  for (const pr of powerReferrers ?? []) {
    const { data: dup } = await admin
      .from("shadowscale_action_queue")
      .select("id")
      .eq("action_type", "referral_campaign")
      .contains("payload", { user_id: pr.user_id })
      .in("status", ["pending", "approved", "running"])
      .maybeSingle();
    if (dup) continue;

    await admin.from("shadowscale_action_queue").insert({
      action_type: "referral_campaign",
      payload: {
        user_id: pr.user_id,
        referral_code: pr.referral_code,
        total_referrals: pr.total_referrals,
        message: ethical
          ? `You're a top referrer (${pr.total_referrals}) — share your link for bonus credits`
          : `Power referrer ${pr.referral_code}: bonus credits for your next referral`,
      },
      priority: 60,
      confidence: 0.78,
      status: "approved",
      created_by: "orchestrator",
    });
    queued.push("referral_campaign");
  }

  const convRate = metrics.referrals > 0 ? metrics.conversions / metrics.referrals : 0;
  const lowShares = metrics.shares < 2 && metrics.active_users >= 1;
  if ((metrics.referrals > 0 && convRate < 0.1) || lowShares) {
    const { data: dupShare } = await admin
      .from("shadowscale_action_queue")
      .select("id")
      .eq("action_type", "share_campaign")
      .in("status", ["pending", "approved", "running"])
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .maybeSingle();
    if (!dupShare) {
      await admin.from("shadowscale_action_queue").insert({
        action_type: "share_campaign",
        payload: {
          message: ethical
            ? "Referral conversion is low — we'll gently amplify share prompts after chat wins"
            : "Referral conversion low — amplify share prompts on chat wins",
          play: "trust_builder",
        },
        priority: 55,
        confidence: autopilot ? 0.82 : 0.72,
        status: autopilot ? "approved" : "pending",
        created_by: "orchestrator",
      });
      queued.push("share_campaign");
    }
  }

  if (metrics.shares < 3 && metrics.active_users > 5) {
    const { data: dupVideo } = await admin
      .from("shadowscale_action_queue")
      .select("id")
      .eq("action_type", "video_studio_promo")
      .in("status", ["pending", "approved", "running", "done"])
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .maybeSingle();
    if (!dupVideo) {
      await admin.from("shadowscale_action_queue").insert({
        action_type: "video_studio_promo",
        payload: {
          message: "Pro users can generate viral shorts in Video Studio — no API key required",
          path: "/video-studio",
        },
        priority: 50,
        confidence: 0.76,
        status: "approved",
        created_by: "orchestrator",
      });
      queued.push("video_studio_promo");
    }
  }

  if (metrics.signups > 2 && metrics.active_users < Math.max(2, metrics.signups * 0.3)) {
    const { data: dupRe } = await admin
      .from("shadowscale_action_queue")
      .select("id")
      .eq("action_type", "re_engagement_nudge")
      .gte("created_at", new Date(Date.now() - 3 * 86400000).toISOString())
      .maybeSingle();
    if (!dupRe) {
      await admin.from("shadowscale_action_queue").insert({
        action_type: "re_engagement_nudge",
        payload: {
          message: ethical
            ? "New signups are up — nudge returning users with a changelog highlight"
            : "Re-engage dormant users with product update",
        },
        priority: 45,
        confidence: 0.74,
        status: autopilot ? "approved" : "pending",
        created_by: "orchestrator",
      });
      queued.push("re_engagement_nudge");
    }
  }

  if (autopilot && ethical) {
    const { data: dupBlog } = await admin
      .from("shadowscale_action_queue")
      .select("id")
      .eq("action_type", "publish_blog")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .maybeSingle();
    if (!dupBlog) {
      await admin.from("shadowscale_action_queue").insert({
        action_type: "publish_blog",
        payload: { source: "shadowscale_autopilot" },
        priority: 40,
        confidence: 0.86,
        status: "approved",
        created_by: "orchestrator",
      });
      queued.push("publish_blog");
    }
  }

  return queued;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "shadow-scale-orchestrator" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const isCron = await isCronOrService(req);
  const isAdmin = await isAdminJwt(req);

  if (body.client_id && !isCron && !isAdmin) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (supabaseUrl && serviceRole) {
      const admin = createClient(supabaseUrl, serviceRole);
      await admin.from("shadowscale_heartbeats").insert({
        client_id: body.client_id,
        user_id: body.user_id ?? null,
        route: body.route ?? null,
        events: body.events ?? [],
      });
    }
    return new Response(JSON.stringify({ ok: true, heartbeat: true }), { headers: corsHeaders });
  }

  if (!isCron && !isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(supabaseUrl, serviceRole);

    if (body.run_worker_only) {
      await invokeWorker(supabaseUrl, serviceRole);
      return new Response(JSON.stringify({ ok: true, worker: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config } = await admin.from("shadowscale_config").select("*").limit(1).maybeSingle();
    if (config && !config.enabled) {
      return new Response(JSON.stringify({ ok: true, paused: true }), { headers: corsHeaders });
    }

    const metrics = await snapshotMetrics(admin);
    const queued = await runPlaybooks(admin, metrics, config);

    const autopilot = config?.autopilot ?? false;
    const { data: pending } = await admin
      .from("shadowscale_action_queue")
      .select("id, action_type, confidence, status")
      .eq("status", "pending")
      .limit(20);

    let autoApproved = 0;
    for (const item of pending ?? []) {
      const lowRisk = LOW_RISK_ACTIONS.has(item.action_type);
      if (lowRisk && (item.confidence ?? 0) >= 0.75) {
        await admin.from("shadowscale_action_queue").update({ status: "approved" }).eq("id", item.id);
        autoApproved++;
      } else if (autopilot && (item.confidence ?? 0) >= 0.85) {
        await admin.from("shadowscale_action_queue").update({ status: "approved" }).eq("id", item.id);
        autoApproved++;
      }
    }

    await invokeWorker(supabaseUrl, serviceRole);

    return new Response(
      JSON.stringify({ ok: true, metrics, queued, autoApproved }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

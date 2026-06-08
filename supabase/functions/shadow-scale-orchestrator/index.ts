import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const LOW_RISK = new Set([
  "referral_campaign",
  "changelog_nudge",
  "share_campaign",
  "in_app_announcement_draft",
]);

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

async function snapshotMetrics(admin: ReturnType<typeof createClient>) {
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = `${today}T00:00:00.000Z`;

  const [{ count: profiles }, { count: convToday }, { count: referrals }, { count: conversions }] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
      admin.from("referrals").select("id", { count: "exact", head: true }),
      admin.from("referrals").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    ]);

  await admin.from("shadowscale_metrics_daily").upsert(
    {
      metric_date: today,
      signups: profiles ?? 0,
      active_users: convToday ?? 0,
      referrals: referrals ?? 0,
      conversions: conversions ?? 0,
    },
    { onConflict: "metric_date" },
  );

  return { profiles: profiles ?? 0, referrals: referrals ?? 0, conversions: conversions ?? 0 };
}

async function runPlaybooks(
  admin: ReturnType<typeof createClient>,
  metrics: { profiles: number; referrals: number; conversions: number },
) {
  const queued: string[] = [];

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
        message: `Power referrer ${pr.referral_code}: offer bonus credits for next referral`,
      },
      priority: 60,
      confidence: 0.78,
      status: "approved",
      created_by: "orchestrator",
    });
    queued.push("referral_campaign");
  }

  if (metrics.referrals > 0 && metrics.conversions / Math.max(metrics.referrals, 1) < 0.1) {
    await admin.from("shadowscale_action_queue").insert({
      action_type: "share_campaign",
      payload: {
        message: "Referral conversion low — amplify share prompts on chat wins",
        play: "trust_builder",
      },
      priority: 55,
      confidence: 0.72,
      status: "pending",
      created_by: "orchestrator",
    });
    queued.push("share_campaign");
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

    const { data: config } = await admin.from("shadowscale_config").select("*").limit(1).maybeSingle();
    if (config && !config.enabled) {
      return new Response(JSON.stringify({ ok: true, paused: true }), { headers: corsHeaders });
    }

    const metrics = await snapshotMetrics(admin);
    const queued = await runPlaybooks(admin, metrics);

    const autopilot = config?.autopilot ?? false;
    const { data: pending } = await admin
      .from("shadowscale_action_queue")
      .select("id, action_type, confidence, status")
      .eq("status", "pending")
      .limit(20);

    let autoApproved = 0;
    for (const item of pending ?? []) {
      const lowRisk = LOW_RISK.has(item.action_type);
      if (lowRisk && (item.confidence ?? 0) >= 0.75) {
        await admin.from("shadowscale_action_queue").update({ status: "approved" }).eq("id", item.id);
        autoApproved++;
      } else if (autopilot && (item.confidence ?? 0) >= 0.85) {
        await admin.from("shadowscale_action_queue").update({ status: "approved" }).eq("id", item.id);
        autoApproved++;
      }
    }

    await fetch(`${supabaseUrl}/functions/v1/shadow-scale-worker`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trigger: "orchestrator" }),
    }).catch(() => null);

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

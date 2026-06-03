import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

interface SearchAnalyticsRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    // Admin-only
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.userId);
    const isAdmin = roles?.some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
    if (!LOVABLE_API_KEY || !GSC_KEY) {
      return new Response(JSON.stringify({ error: "Google Search Console connector is not linked" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_KEY,
    };

    // List verified sites
    const sitesRes = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
    if (!sitesRes.ok) {
      const t = await sitesRes.text();
      throw new Error(`GSC sites list failed (${sitesRes.status}): ${t.slice(0, 200)}`);
    }
    const sitesJson = await sitesRes.json();
    const sites: Array<{ siteUrl: string; permissionLevel: string }> = sitesJson.siteEntry || [];

    // Pick first site with full/owner permission, else first available
    const preferred = sites.find((s) => /Owner|Full/i.test(s.permissionLevel)) || sites[0];
    if (!preferred) {
      return new Response(JSON.stringify({ sites: [], summary: null, message: "No verified sites" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query last 28 days totals + top 5 queries + top 5 pages
    const today = new Date();
    const end = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // GSC lags ~2 days
    const start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const siteUrlEnc = encodeURIComponent(preferred.siteUrl);

    async function query(dimensions: string[], rowLimit = 5) {
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${siteUrlEnc}/searchAnalytics/query`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: fmt(start),
          endDate: fmt(end),
          dimensions,
          rowLimit,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.warn(`GSC query ${dimensions.join(",")} failed:`, r.status, t.slice(0, 200));
        return { rows: [] as SearchAnalyticsRow[] };
      }
      return await r.json() as { rows?: SearchAnalyticsRow[] };
    }

    const [totals, topQueries, topPages] = await Promise.all([
      query([], 1),
      query(["query"], 5),
      query(["page"], 5),
    ]);

    const total = totals.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    return new Response(JSON.stringify({
      site: preferred.siteUrl,
      sites: sites.map((s) => s.siteUrl),
      range: { start: fmt(start), end: fmt(end) },
      totals: {
        clicks: total.clicks,
        impressions: total.impressions,
        ctr: total.ctr,
        position: total.position,
      },
      topQueries: (topQueries.rows || []).map((r) => ({ query: r.keys?.[0] || "", ...r })),
      topPages: (topPages.rows || []).map((r) => ({ page: r.keys?.[0] || "", ...r })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("gsc-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

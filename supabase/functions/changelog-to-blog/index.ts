import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }
  const corsHeaders = getCorsHeaders(origin);

  const cronSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
  const providedCron = req.headers.get("x-internal-cron-secret") || "";
  const isCron = Boolean(cronSecret && providedCron === cronSecret);

  if (!isCron) {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;
    const { data: roleRow } = await auth.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin or cron only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const since = new Date();
    since.setDate(since.getDate() - 14);

    const { data: entries, error } = await supabase
      .from("changelog_entries")
      .select("id, version, title, description, change_type, tags, published_at")
      .eq("is_published", true)
      .gte("published_at", since.toISOString())
      .order("published_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const created: { slug: string; title: string }[] = [];
    const skipped: string[] = [];

    for (const entry of entries || []) {
      const baseSlug = `changelog-${slugify(entry.version)}-${slugify(entry.title)}`;

      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (existing) {
        skipped.push(baseSlug);
        continue;
      }

      const changeLabel =
        entry.change_type === "feature"
          ? "New feature"
          : entry.change_type === "security"
            ? "Security"
            : entry.change_type === "bugfix"
              ? "Fix"
              : "Improvement";

      const content = `## ${entry.title}

**${changeLabel}** · Version \`${entry.version}\`

${entry.description}

---

This post was generated from our public [changelog](https://www.shadowtalk-ai.com/changelog). [Try ShadowTalk free](https://www.shadowtalk-ai.com/chatbot?utm_source=blog&utm_medium=changelog_sync&utm_campaign=product_update) — agentic chat, missions, and 30+ tools.`;

      const excerpt = entry.description.slice(0, 160);

      const { error: insertError } = await supabase.from("blog_posts").insert({
        title: `${entry.title} — ShadowTalk ${entry.version}`,
        slug: baseSlug,
        excerpt,
        content,
        category: "Product Updates",
        tags: ["changelog", entry.change_type, ...(entry.tags || [])],
        is_published: true,
        published_at: entry.published_at || new Date().toISOString(),
        author: "ShadowTalk Team",
        read_time_minutes: Math.max(2, Math.ceil(entry.description.length / 900)),
      });

      if (insertError) {
        console.error("[changelog-to-blog] insert", insertError);
        skipped.push(baseSlug);
        continue;
      }

      created.push({ slug: baseSlug, title: entry.title });
    }

    return new Response(
      JSON.stringify({
        success: true,
        created,
        skipped,
        scanned: entries?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[changelog-to-blog]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Sync failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

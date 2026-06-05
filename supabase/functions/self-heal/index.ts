import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ErrorPayload {
  kind: string;
  message: string;
  stack?: string;
  source_file?: string;
  line_number?: number;
  column_number?: number;
  url?: string;
  route?: string;
  context?: Record<string, unknown>;
  fingerprint: string;
  user_agent?: string;
}

async function embed(text: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: text.slice(0, 4000),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

async function analyze(error: ErrorPayload, sourceContext: string): Promise<{
  diagnosis: string;
  patch_strategy: string;
  target_files: string[];
  patch_diff: string | null;
  runtime_handler: Record<string, unknown> | null;
  confidence: number;
}> {
  const prompt = `You are ShadowTalk's autonomous self-healing engine. Diagnose this error and propose a fix.

ERROR:
Kind: ${error.kind}
Message: ${error.message}
Stack: ${error.stack ?? "(none)"}
File: ${error.source_file ?? "(unknown)"}:${error.line_number ?? "?"}
Route: ${error.route ?? "(unknown)"}

RELEVANT SOURCE CODE:
${sourceContext || "(no indexed source available)"}

Respond as STRICT JSON:
{
  "diagnosis": "1-3 sentence root cause",
  "patch_strategy": "runtime_recover | source_patch | config_change | manual_only",
  "target_files": ["path/to/file.ts"],
  "patch_diff": "unified diff if source_patch, else null",
  "runtime_handler": {"action":"retry|fallback|silence|reload","details":"..."} or null,
  "confidence": 0.0-1.0
}

Pick "runtime_recover" for transient network/API errors. Pick "source_patch" only when the bug is clearly in code shown above. Pick "manual_only" if unsure.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return {
    diagnosis: String(parsed.diagnosis ?? "Unable to diagnose"),
    patch_strategy: ["runtime_recover", "source_patch", "config_change", "manual_only"].includes(parsed.patch_strategy)
      ? parsed.patch_strategy
      : "manual_only",
    target_files: Array.isArray(parsed.target_files) ? parsed.target_files.slice(0, 10) : [],
    patch_diff: parsed.patch_diff ?? null,
    runtime_handler: parsed.runtime_handler ?? null,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as ErrorPayload;
    if (!payload?.message || !payload?.fingerprint) {
      return new Response(JSON.stringify({ error: "message and fingerprint required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Auth (optional)
    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: auth } },
      });
      const { data } = await anon.auth.getClaims(auth.replace("Bearer ", ""));
      userId = data?.claims?.sub ?? null;
    }

    // Upsert error by fingerprint
    const { data: existing } = await admin
      .from("shadowtalk_errors")
      .select("id, occurrences")
      .eq("fingerprint", payload.fingerprint)
      .maybeSingle();

    let errorId: string;
    if (existing) {
      errorId = existing.id;
      await admin
        .from("shadowtalk_errors")
        .update({
          occurrences: (existing.occurrences ?? 1) + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", errorId);
    } else {
      const { data: inserted, error: insErr } = await admin
        .from("shadowtalk_errors")
        .insert({
          user_id: userId,
          kind: payload.kind,
          message: payload.message.slice(0, 2000),
          stack: payload.stack?.slice(0, 8000),
          source_file: payload.source_file,
          line_number: payload.line_number,
          column_number: payload.column_number,
          url: payload.url,
          route: payload.route,
          context: payload.context ?? {},
          user_agent: payload.user_agent,
          fingerprint: payload.fingerprint,
          status: "analyzing",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      errorId = inserted.id;
    }

    // RAG: find relevant source
    const queryText = `${payload.message}\n${payload.source_file ?? ""}\n${payload.stack ?? ""}`;
    const queryEmbed = await embed(queryText);
    let sourceContext = "";
    if (queryEmbed) {
      const { data: chunks } = await admin.rpc("match_source_chunks", {
        query_embedding: queryEmbed,
        match_count: 6,
      });
      if (chunks?.length) {
        sourceContext = chunks
          .map((c: { file_path: string; content: string }) => `--- ${c.file_path} ---\n${c.content}`)
          .join("\n\n")
          .slice(0, 12000);
      }
    }

    // AI diagnosis
    const analysis = await analyze(payload, sourceContext);

    // Store proposal
    const { data: proposal, error: propErr } = await admin
      .from("shadowtalk_fix_proposals")
      .insert({
        error_id: errorId,
        model: "google/gemini-2.5-flash",
        diagnosis: analysis.diagnosis,
        patch_strategy: analysis.patch_strategy,
        target_files: analysis.target_files,
        patch_diff: analysis.patch_diff,
        runtime_handler: analysis.runtime_handler,
        confidence: analysis.confidence,
        status: analysis.patch_strategy === "runtime_recover" && analysis.confidence >= 0.7 ? "approved" : "pending",
      })
      .select()
      .single();
    if (propErr) throw propErr;

    await admin
      .from("shadowtalk_errors")
      .update({ status: "proposed" })
      .eq("id", errorId);

    return new Response(JSON.stringify({ ok: true, error_id: errorId, proposal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[self-heal]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

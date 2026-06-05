import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

interface SourceFile {
  path: string;
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "auth required" }), { status: 401, headers: corsHeaders });

    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claimsData } = await anon.auth.getClaims(auth.replace("Bearer ", ""));
    const uid = claimsData?.claims?.sub;
    if (!uid) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: roleRow } = await anon
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "admin only" }), { status: 403, headers: corsHeaders });

    const { files } = (await req.json()) as { files: SourceFile[] };
    if (!Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "files required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    let indexed = 0;
    let skipped = 0;

    for (const file of files.slice(0, 200)) {
      // Chunk by ~1200 chars
      const chunks: string[] = [];
      const CHUNK = 1200;
      for (let i = 0; i < file.content.length; i += CHUNK) {
        chunks.push(file.content.slice(i, i + CHUNK));
      }

      for (let idx = 0; idx < chunks.length; idx++) {
        const content = chunks[idx];
        const hash = await sha256(content);

        const { data: existing } = await admin
          .from("shadowtalk_source_chunks")
          .select("id, content_hash")
          .eq("file_path", file.path)
          .eq("chunk_index", idx)
          .maybeSingle();

        if (existing?.content_hash === hash) {
          skipped++;
          continue;
        }

        const embedding = await embed(content);
        const payload = {
          file_path: file.path,
          chunk_index: idx,
          content,
          content_hash: hash,
          embedding,
          language: file.path.split(".").pop() ?? null,
          indexed_at: new Date().toISOString(),
        };

        if (existing) {
          await admin.from("shadowtalk_source_chunks").update(payload).eq("id", existing.id);
        } else {
          await admin.from("shadowtalk_source_chunks").insert(payload);
        }
        indexed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, indexed, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

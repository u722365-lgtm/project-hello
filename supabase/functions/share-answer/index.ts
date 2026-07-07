import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
function makeSlug(len = 8): string {
  let s = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) s += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  return s;
}

interface Payload {
  prompt: string;
  answer: string;
  title?: string;
  model?: string;
  source?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    let userId: string | null = null;
    const auth = req.headers.get("Authorization") ?? "";
    if (auth.startsWith("Bearer ")) {
      const anon = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: auth } },
      });
      const { data } = await anon.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const body = (await req.json()) as Payload;
    const prompt = String(body.prompt ?? "").slice(0, 4000).trim();
    const answer = String(body.answer ?? "").slice(0, 20000).trim();
    if (!prompt || !answer) {
      return new Response(JSON.stringify({ ok: false, error: "prompt and answer required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRole);
    let slug = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      slug = makeSlug(8);
      const { data: existing } = await admin
        .from("shared_answers").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
    }

    const title = (body.title ?? prompt.split("\n")[0]).slice(0, 140);
    const { data, error } = await admin.from("shared_answers").insert({
      slug,
      user_id: userId,
      source: body.source ?? "chat",
      title,
      prompt,
      answer,
      model: body.model ?? null,
    }).select("slug").single();

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, slug: data.slug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

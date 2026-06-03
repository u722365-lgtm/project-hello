import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/microsoft_powerpoint";

interface Body {
  filename: string;
  base64: string; // raw .pptx bytes, base64-encoded
  folderPath?: string; // e.g. "ShadowTalk/Presentations" — optional, defaults to root
}

function safeName(name: string): string {
  // Strip path separators and characters Graph disallows
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "_").trim();
  return cleaned.toLowerCase().endsWith(".pptx") ? cleaned : `${cleaned}.pptx`;
}

function safeFolder(path?: string): string {
  if (!path) return "";
  return path
    .split("/")
    .map((s) => s.trim().replace(/[\\:*?"<>|]/g, "_"))
    .filter(Boolean)
    .join("/");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PPT_KEY = Deno.env.get("MICROSOFT_POWERPOINT_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!PPT_KEY) throw new Error("Microsoft PowerPoint connector is not linked");

    const body = await req.json() as Body;
    if (!body?.filename || !body?.base64) {
      return new Response(JSON.stringify({ error: "filename and base64 are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filename = safeName(body.filename);
    const folder = safeFolder(body.folderPath);
    const targetPath = folder ? `${folder}/${filename}` : filename;
    const url = `${GATEWAY}/me/drive/root:/${encodeURI(targetPath)}:/content`;

    // Decode base64 → Uint8Array
    const bin = atob(body.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": PPT_KEY,
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      },
      body: bytes,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OneDrive upload failed:", res.status, text);
      return new Response(JSON.stringify({ error: `Upload failed (${res.status})`, details: text.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    return new Response(JSON.stringify({
      ok: true,
      id: json.id,
      name: json.name,
      webUrl: json.webUrl,
      size: json.size,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("upload-presentation-onedrive error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

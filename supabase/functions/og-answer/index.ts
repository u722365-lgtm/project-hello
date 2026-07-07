import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function wrap(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxCharsPerLine) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxCharsPerLine - 1) + "…";
  }
  return lines;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  if (!slug) return new Response("missing slug", { status: 400 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceRole);

  const { data } = await admin.from("shared_answers")
    .select("title, prompt, source").eq("slug", slug).maybeSingle();

  const title = data?.title ?? "ShadowTalk AI answer";
  const source = data?.source === "strategy" ? "Strategy Agent" : "AI Chat";
  const titleLines = wrap(title, 34, 3);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0f1a"/>
      <stop offset="1" stop-color="#1a1030"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="180" fill="url(#accent)" opacity="0.18"/>
  <circle cx="150" cy="520" r="220" fill="url(#accent)" opacity="0.12"/>
  <g transform="translate(80,90)">
    <rect width="46" height="46" rx="12" fill="url(#accent)"/>
    <text x="60" y="32" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff">ShadowTalk</text>
    <text x="200" y="32" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#9ca3af">${esc(source)}</text>
  </g>
  <g transform="translate(80,220)">
    ${titleLines.map((l, i) => `<text x="0" y="${i * 78}" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="800" fill="#ffffff">${esc(l)}</text>`).join("")}
  </g>
  <g transform="translate(80,560)">
    <text x="0" y="0" font-family="Inter, system-ui, sans-serif" font-size="22" fill="#a78bfa" font-weight="600">Try it free — no login required · shadowtalk-ai.com</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
});

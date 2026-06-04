import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const SITE = "https://www.shadowtalk-ai.com";
const DEFAULT_IMAGE = `${SITE}/og-image.png`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const url = new URL(req.url);
    const title = escapeHtml(url.searchParams.get("title") || "ShadowTalk AI");
    const subtitle = escapeHtml(
      url.searchParams.get("subtitle") || "Agentic workspace — chat, missions, and 30+ tools",
    );
    const redirectRaw = url.searchParams.get("redirect") || `${SITE}/chatbot`;
    const redirect = redirectRaw.startsWith("http") ? redirectRaw : `${SITE}/chatbot`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${subtitle}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ShadowTalk AI" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${subtitle}" />
  <meta property="og:image" content="${DEFAULT_IMAGE}" />
  <meta property="og:url" content="${escapeHtml(redirect)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${subtitle}" />
  <meta name="twitter:image" content="${DEFAULT_IMAGE}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(redirect)}" />
  <link rel="canonical" href="${escapeHtml(redirect)}" />
</head>
<body>
  <p><a href="${escapeHtml(redirect)}">Continue to ShadowTalk →</a></p>
  <script>location.replace(${JSON.stringify(redirect)});</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response("Bad request", { status: 400, headers: corsHeaders });
  }
});

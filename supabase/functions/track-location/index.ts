import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { optionalAuth } from "../_shared/auth.ts";

function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const msg = (error as { message?: string })?.message ?? String(error);
  return code === "42P01" || msg.includes('relation "user_locations" does not exist');
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const { userId } = await optionalAuth(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          warning: "Location tracking not configured (missing Supabase env).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ success: false, warning: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, warning: "sessionId required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const { data: existing, error: existingError } = await supabase
      .from("user_locations")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existingError) {
      if (isMissingTable(existingError)) {
        return new Response(
          JSON.stringify({
            success: false,
            warning: "Location tracking table not configured (migration pending).",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
      console.error("Lookup error:", existingError);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("user_locations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);

      if (updateError && isMissingTable(updateError)) {
        return new Response(
          JSON.stringify({
            success: false,
            warning: "Location tracking table not configured (migration pending).",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
      if (updateError) console.error("Update error:", updateError);

      return new Response(
        JSON.stringify({ success: true, message: "Location updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    let geoData = {
      country: "Unknown",
      countryCode: "XX",
      region: "",
      city: "",
      lat: 0,
      lon: 0,
      timezone: "UTC",
      isp: "",
    };

    try {
      const geoResponse = await fetch(
        `https://ip-api.com/json/${encodeURIComponent(clientIP)}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp`,
      );
      if (geoResponse.ok) {
        const data = await geoResponse.json();
        if (data.status === "success") {
          geoData = {
            country: data.country || "Unknown",
            countryCode: data.countryCode || "XX",
            region: data.region || "",
            city: data.city || "",
            lat: data.lat || 0,
            lon: data.lon || 0,
            timezone: data.timezone || "UTC",
            isp: data.isp || "",
          };
        }
      }
    } catch (geoError) {
      console.error("Geolocation API error:", geoError);
    }

    const resolvedUserId =
      userId ?? (typeof body.userId === "string" ? body.userId.slice(0, 64) : null);

    const { error: insertError } = await supabase.from("user_locations").insert({
      session_id: sessionId,
      user_id: resolvedUserId,
      ip_address: clientIP,
      country: geoData.country,
      country_code: geoData.countryCode,
      region: geoData.region,
      city: geoData.city,
      latitude: geoData.lat,
      longitude: geoData.lon,
      timezone: geoData.timezone,
      isp: geoData.isp,
    });

    if (insertError) {
      if (isMissingTable(insertError)) {
        return new Response(
          JSON.stringify({
            success: false,
            warning: "Location tracking table not configured (migration pending).",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, warning: "Location tracking failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        location: {
          country: geoData.country,
          countryCode: geoData.countryCode,
          city: geoData.city,
          timezone: geoData.timezone,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Error tracking location:", error);
    return new Response(
      JSON.stringify({ success: false, warning: "Location tracking failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

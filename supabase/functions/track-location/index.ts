import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const auth = await requireAuth(req, corsHeaders);
    // If auth fails, return the auth response (typically 401) but never crash the function.
    if (!auth.authenticated) return auth.response;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Fail-safe: if not configured, acknowledge and exit without throwing.
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          warning: "Location tracking not configured (missing Supabase env).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "unknown";

    // Check existing session
    const { data: existing, error: existingError } = await supabase
      .from("user_locations")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existingError) {
      // Graceful degradation if migration not applied yet.
      const code = (existingError as { code?: string }).code;
      const msg = (existingError as { message?: string }).message ?? String(existingError);
      if (code === "42P01" || msg.includes('relation "user_locations" does not exist')) {
        return new Response(
          JSON.stringify({ success: false, warning: "Location tracking table not configured (migration pending)." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
      // Log but do not crash the app.
      console.error("Lookup error:", existingError);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("user_locations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);

      if (updateError) {
        const code = (updateError as { code?: string }).code;
        const msg = (updateError as { message?: string }).message ?? String(updateError);
        if (code === "42P01" || msg.includes('relation "user_locations" does not exist')) {
          return new Response(
            JSON.stringify({ success: false, warning: "Location tracking table not configured (migration pending)." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
          );
        }
        console.error("Update error:", updateError);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Location updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geo lookup
    let geoData = { country: "Unknown", countryCode: "XX", region: "", city: "", lat: 0, lon: 0, timezone: "UTC", isp: "" };

    try {
      // Use https to avoid mixed-content / transport restrictions in some environments.
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

    const { error: insertError } = await supabase
      .from("user_locations")
      .insert({
        session_id: sessionId,
        user_id: auth.userId,
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
      const code = (insertError as { code?: string }).code;
      const msg = (insertError as { message?: string }).message ?? String(insertError);
      if (code === "42P01" || msg.includes('relation "user_locations" does not exist')) {
        return new Response(
          JSON.stringify({ success: false, warning: "Location tracking table not configured (migration pending)." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ success: false, error: "Location tracking failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        location: { country: geoData.country, countryCode: geoData.countryCode, city: geoData.city, timezone: geoData.timezone },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error tracking location:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Location tracking failed" }),
      // Never 500: avoid blank-screen runtime overlays in the client on misconfigured backends.
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";


// Admin emails that should automatically get admin role
const ADMIN_EMAILS = [
  "j3451500@gmail.com",
  "zaim98269@gmail.com",
  "laibaanis345@gmail.com",
];

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASSIGN-ADMIN-ROLE] ${step}${detailsStr}`);
};

function isMissingTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: string; message?: string; details?: string; hint?: string };
  if (anyErr.code === "42P01") return true; // undefined_table
  const msg = `${anyErr.message ?? ""} ${anyErr.details ?? ""} ${anyErr.hint ?? ""}`.toLowerCase();
  return msg.includes("user_roles") && (msg.includes("does not exist") || msg.includes("undefined_table"));
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // If the service role key is not configured, never hard-fail the client.
  // This function is a convenience (auto-assign admin for a small allowlist),
  // and the app should continue working without it.
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({
        isAdmin: false,
        message: "Admin role assignment not configured",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    logStep("Function started");

    let auth: Awaited<ReturnType<typeof requireAuth>>;
    try {
      auth = await requireAuth(req, corsHeaders);
    } catch (e) {
      // Auth helper should not take down the app if misconfigured.
      logStep("Auth helper failed", { message: e instanceof Error ? e.message : String(e) });
      return new Response(JSON.stringify({ isAdmin: false, message: "Admin role check unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    if (!auth.authenticated) return auth.response;

    const { userId, email } = auth;
    await checkRateLimit(userId, supabaseClient);

    if (!email) {
      throw new Error("User email not available");
    }

    logStep("User authenticated", { userId, email });

    // Check if user email is in admin list
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      logStep("User is not in admin list");
      return new Response(JSON.stringify({ isAdmin: false, message: "Not an admin email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user already has admin role
    const { data: existingRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      if (isMissingTable(roleError)) {
        return new Response(JSON.stringify({ isAdmin: false, message: "Admin roles not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error(`Error checking existing role: ${roleError.message}`);
    }

    if (existingRole) {
      logStep("User already has admin role");
      return new Response(JSON.stringify({ isAdmin: true, message: "Already admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Assign admin role
    const { error: insertError } = await supabaseClient
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (insertError) {
      if (isMissingTable(insertError)) {
        return new Response(JSON.stringify({ isAdmin: false, message: "Admin roles not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error(`Error assigning admin role: ${insertError.message}`);
    }

    logStep("Admin role assigned successfully");
    return new Response(JSON.stringify({ isAdmin: true, message: "Admin role assigned" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Do not surface a 500 to the frontend for this convenience function.
    return new Response(JSON.stringify({ isAdmin: false, error: "Admin role check failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

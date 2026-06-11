import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

/**
 * Jules cloud agent is disabled — ShadowTalk device-only pledge blocks user code
 * from leaving the device. Use the on-device agent in Code IDE instead.
 */
serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  return new Response(
    JSON.stringify({
      error:
        "Cloud Jules agent is disabled. ShadowTalk keeps your code on-device — use the On-Device Agent in Code IDE.",
      code: "DEVICE_ONLY_PLEDGE",
    }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Shared authentication helper for edge functions.
 * Validates JWT and returns user claims.
 */
export interface AuthResult {
  authenticated: true;
  userId: string;
  email?: string;
  supabase: ReturnType<typeof createClient>;
}

export interface AuthError {
  authenticated: false;
  response: Response;
}

export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<AuthResult | AuthError> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header", success: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  // Fail-safe: if backend isn't configured, never throw (prevents edge runtime errors).
  if (!supabaseUrl || !anonKey) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Auth not configured", warning: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  try {
    const supabase = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getClaims(token);

    if (error || !data?.claims) {
      return {
        authenticated: false,
        response: new Response(
          JSON.stringify({ error: "Invalid or expired token", success: false }),
          // 200 avoids client runtime overlays on stale sessions; callers should check authenticated flag.
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        ),
      };
    }

    return {
      authenticated: true,
      userId: data.claims.sub as string,
      email: data.claims.email as string | undefined,
      supabase,
    };
  } catch (e) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Auth failed", warning: e instanceof Error ? e.message : String(e) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
}

/**
 * Optional auth — returns user info if present, null if not.
 * Use for endpoints that work for both anonymous and authenticated users.
 */
export async function optionalAuth(
  req: Request
): Promise<{ userId: string | null; email?: string }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null };
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !anonKey) return { userId: null };

    const supabase = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getClaims(token);

    if (error || !data?.claims) {
      return { userId: null };
    }

    return {
      userId: data.claims.sub as string,
      email: data.claims.email as string | undefined,
    };
  } catch {
    return { userId: null };
  }
}

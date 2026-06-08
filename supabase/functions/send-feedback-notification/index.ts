import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { FEEDBACK_NOTIFICATION_EMAILS } from "../_shared/feedbackRecipients.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY") ||
  Deno.env.get("Resend_api_key") ||
  Deno.env.get("resend_api_key");
const RESEND_FROM =
  Deno.env.get("RESEND_FROM") || "ShadowTalk AI <onboarding@resend.dev>";


interface FeedbackNotificationRequest {
  feedbackId: string;
  category: string;
  rating: number;
  message: string;
  userEmail?: string;
}

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'bug': return '🐛 Bug Report';
    case 'feature': return '💡 Feature Request';
    case 'improvement': return '⚡ Improvement Suggestion';
    case 'other': return '❓ Other';
    default: return '📝 General Feedback';
  }
};

const getRatingStars = (rating: number): string => {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
};

const escapeHtml = (s: string): string =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  // IP-based rate limit: 10 / 10min
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  // @ts-ignore
  const RL: Map<string, number[]> = (globalThis as any).__feedbackRL ??= new Map();
  const now = Date.now();
  const recent = (RL.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 10) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  recent.push(now); RL.set(ip, recent);

  try {
    const rawBody: FeedbackNotificationRequest = await req.json();
    const feedbackId = escapeHtml(String(rawBody.feedbackId || ""));
    const category = escapeHtml(String(rawBody.category || "other"));
    const rating = Math.min(5, Math.max(0, Number(rawBody.rating) || 0));
    const message = escapeHtml(String(rawBody.message || ""));
    const userEmail = rawBody.userEmail ? escapeHtml(String(rawBody.userEmail)) : undefined;

    const adminEmails = [...FEEDBACK_NOTIFICATION_EMAILS];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%); padding: 24px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 24px; }
            .content { padding: 24px; }
            .badge { display: inline-block; background: rgba(0, 212, 255, 0.2); border: 1px solid rgba(0, 212, 255, 0.3); color: #00d4ff; padding: 6px 12px; border-radius: 20px; font-size: 14px; margin-bottom: 16px; }
            .rating { font-size: 20px; margin: 16px 0; }
            .message { background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 3px solid #00d4ff; }
            .meta { color: #888; font-size: 12px; margin-top: 16px; }
            .footer { text-align: center; padding: 16px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 New Feedback Received</h1>
            </div>
            <div class="content">
              <div class="badge">${getCategoryLabel(category)}</div>
              <div class="rating">Rating: ${getRatingStars(rating)} (${rating}/5)</div>
              <div class="message">
                <p style="margin: 0;">${message}</p>
              </div>
              <div class="meta">
                <p><strong>From:</strong> ${userEmail || 'Anonymous user'}</p>
                <p><strong>Feedback ID:</strong> ${feedbackId}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from ShadowTalk AI</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const plainText = `
New Feedback Received

Category: ${getCategoryLabel(category)}
Rating: ${rating}/5

Message:
${message}

From: ${userEmail || 'Anonymous user'}
Feedback ID: ${feedbackId}
Time: ${new Date().toLocaleString()}
    `.trim();

    let emailResult: any = null;
    let emailProvider = '';

    // Try SendGrid first (free tier: 100 emails/day, no domain verification needed for testing)
    if (SENDGRID_API_KEY) {
      console.log("[FEEDBACK-NOTIFICATION] Using SendGrid");
      emailProvider = 'SendGrid';
      
      const sendgridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: adminEmails.map((email) => ({ email })) }],
          from: { email: "noreply@shadowtalk.app", name: "ShadowTalk AI" },
          subject: `${getCategoryLabel(category)} - New Feedback (${rating}⭐)`,
          content: [
            { type: "text/plain", value: plainText },
            { type: "text/html", value: emailHtml }
          ],
        }),
      });

      if (sendgridResponse.ok || sendgridResponse.status === 202) {
        emailResult = { success: true, provider: 'sendgrid' };
        console.log("[FEEDBACK-NOTIFICATION] Email sent via SendGrid");
      } else {
        const errorText = await sendgridResponse.text();
        console.error("[FEEDBACK-NOTIFICATION] SendGrid error:", errorText);
        // Fall back to Resend
      }
    }

    // Fall back to Resend if SendGrid fails or isn't configured
    if (!emailResult && RESEND_API_KEY) {
      console.log("[FEEDBACK-NOTIFICATION] Using Resend as fallback");
      emailProvider = 'Resend';
      
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: adminEmails,
          subject: `${getCategoryLabel(category)} - New Feedback (${rating}⭐)`,
          html: emailHtml,
        }),
      });

      const resendBody = await resendResponse.json();
      console.log("[FEEDBACK-NOTIFICATION] Resend response:", resendResponse.status, resendBody);
      if (resendResponse.ok) {
        emailResult = { success: true, provider: "resend", ...resendBody };
      } else {
        console.error("[FEEDBACK-NOTIFICATION] Resend failed:", resendBody);
      }
    }

    if (!emailResult) {
      // Store feedback locally if no email provider is configured
      console.log("[FEEDBACK-NOTIFICATION] No email provider configured, storing feedback");
      
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Feedback is already in the database, just mark notification as pending
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Feedback stored. Email notification pending - configure SENDGRID_API_KEY for email delivery." 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!emailResult?.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email delivery failed. Configure SENDGRID_API_KEY or verify RESEND_FROM domain.",
          provider: emailProvider,
          detail: emailResult,
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(JSON.stringify({ success: true, emailResult, provider: emailProvider }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[FEEDBACK-NOTIFICATION] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

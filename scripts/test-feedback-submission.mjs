#!/usr/bin/env node
/**
 * Inserts a test feedback row and triggers send-feedback-notification.
 * Usage: node scripts/test-feedback-submission.mjs
 */
const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  "https://axsudmhjpfzffcicfvuj.supabase.co";
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4c3VkbWhqcGZ6ZmZjaWNmdnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzY2NTgsImV4cCI6MjA4MDg1MjY1OH0.Jdbo00BVo0QqChuZCxwHYwzdyJK4oBzCxelv1hILEZ4";

const message = `[TEST ${new Date().toISOString()}] Cursor agent feedback verification — safe to ignore.`;

async function main() {
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
  };

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      category: "general",
      rating: 5,
      message,
      email: "cursor-agent-test@shadowtalk.local",
    }),
  });

  const insertBody = await insertRes.json().catch(() => ({}));
  if (!insertRes.ok) {
    console.error("Feedback insert failed:", insertRes.status, insertBody);
    process.exit(1);
  }

  const row = Array.isArray(insertBody) ? insertBody[0] : insertBody;
  console.log("Inserted feedback:", row.id);

  const notifyRes = await fetch(`${SUPABASE_URL}/functions/v1/send-feedback-notification`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      feedbackId: row.id,
      category: "general",
      rating: 5,
      message,
      userEmail: "cursor-agent-test@shadowtalk.local",
    }),
  });

  const notifyBody = await notifyRes.json().catch(() => ({}));
  console.log("Notification status:", notifyRes.status);
  console.log("Notification response:", JSON.stringify(notifyBody, null, 2));

  if (!notifyRes.ok || notifyBody.error) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { genkit, z } from "genkit";
import { googleAI, gemini15Flash } from "@genkit-ai/googleai";
import { onCallGenkit } from "firebase-functions/v2/https";
const cors = require("cors");

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

const corsHandler = cors({ origin: true });

const PLANS: Record<string, { messagesPerDay: number; deepResearchPerDay: number; imagesPerDay: number }> = {
  free: { messagesPerDay: 50, deepResearchPerDay: 3, imagesPerDay: 5 },
  pro: { messagesPerDay: -1, deepResearchPerDay: 20, imagesPerDay: 20 },
  premium: { messagesPerDay: -1, deepResearchPerDay: 50, imagesPerDay: 50 },
  elite: { messagesPerDay: -1, deepResearchPerDay: -1, imagesPerDay: -1 },
};

// ============================================================
// Provider Definitions — Shared Free Pool
// ============================================================

interface ProviderConfig {
  id: string;
  name: string;
  enabled: () => boolean;
  resolveModel: (model: string) => string;
  getUrl: () => string;
  getKey: () => string | undefined;
  getHeaders: (apiKey: string) => Record<string, string>;
  parseError: (status: number, body: string) => string;
  isRateLimit: (status: number, body: string) => boolean;
}

// Ensure you set these secrets/environment variables in Firebase
const groqProvider: ProviderConfig = {
  id: "groq",
  name: "Groq",
  enabled: () => !!process.env.GROQ_API_KEY,
  resolveModel: (m) => {
    if (m.includes("llama")) return m;
    if (m.includes("mixtral")) return m;
    if (m.includes("gemma")) return m;
    return "llama-3.3-70b-versatile";
  },
  getUrl: () => "https://api.groq.com/openai/v1/chat/completions",
  getKey: () => process.env.GROQ_API_KEY,
  getHeaders: (k) => ({
    Authorization: `Bearer ${k}`,
    "Content-Type": "application/json",
  }),
  parseError: (s, b) => `Groq ${s}: ${b.slice(0, 200)}`,
  isRateLimit: (s, b) => s === 429 || b.includes("rate_limit") || b.includes("too many requests"),
};

const googleProvider: ProviderConfig = {
  id: "google",
  name: "Google AI Studio",
  enabled: () => !!process.env.GEMINI_API_KEY,
  resolveModel: (m) => {
    const cleaned = m.replace("google/", "").replace("gemini-", "gemini-");
    return cleaned || "gemini-2.0-flash";
  },
  getUrl: () => "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  getKey: () => process.env.GEMINI_API_KEY,
  getHeaders: (k) => ({
    Authorization: `Bearer ${k}`,
    "Content-Type": "application/json",
  }),
  parseError: (s, b) => `Google AI ${s}: ${b.slice(0, 200)}`,
  isRateLimit: (s, b) => s === 429 || b.includes("RESOURCE_EXHAUSTED") || b.includes("quota"),
};

const openrouterProvider: ProviderConfig = {
  id: "openrouter",
  name: "OpenRouter",
  enabled: () => !!process.env.OPENROUTER_API_KEY,
  resolveModel: (m) => {
    if (!m) return "google/gemini-2.0-flash-exp:free";
    if (m.includes("/")) return m;
    return `google/${m}`;
  },
  getUrl: () => "https://openrouter.ai/api/v1/chat/completions",
  getKey: () => process.env.OPENROUTER_API_KEY,
  getHeaders: (k) => ({
    Authorization: `Bearer ${k}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://shadowtalk.app",
    "X-Title": "ShadowTalk AI",
  }),
  parseError: (s, b) => `OpenRouter ${s}: ${b.slice(0, 200)}`,
  isRateLimit: (s, b) => s === 429 || b.includes("rate_limit") || b.includes("insufficient credits"),
};

const SHARED_POOL: ProviderConfig[] = [groqProvider, googleProvider, openrouterProvider];

// ============================================================
// BYOK Handler
// ============================================================
async function handleByokRequest(
  opts: {
    byokProvider: string;
    byokApiKey: string;
    messages: any[];
    model?: string;
    stream?: boolean;
    personality?: string;
    deepResearch?: boolean;
  },
  res: any
) {
  const { byokProvider, byokApiKey, messages, model, stream = true, personality, deepResearch } = opts;

  let apiUrl: string;
  let resolvedModel: string;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${byokApiKey}`,
  };

  switch (byokProvider) {
    case "groq":
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      resolvedModel = model || "llama-3.3-70b-versatile";
      break;
    case "google":
    case "gemini":
      apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      resolvedModel = model?.replace("google/", "") || "gemini-2.0-flash";
      break;
    case "openai":
      apiUrl = "https://api.openai.com/v1/chat/completions";
      resolvedModel = model || "gpt-4o-mini";
      break;
    case "anthropic":
      return res.status(400).json({ error: "Anthropic BYOK is supported via client-side direct calls only." });
    case "openrouter":
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      resolvedModel = model || "openai/gpt-4o-mini";
      headers["HTTP-Referer"] = "https://shadowtalk.app";
      headers["X-Title"] = "ShadowTalk AI (BYOK)";
      break;
    default:
      apiUrl = byokProvider.startsWith("http") ? byokProvider : `https://api.${byokProvider}.com/v1/chat/completions`;
      resolvedModel = model || "default";
  }

  const systemPrompts: string[] = ["You are ShadowTalk AI, a powerful and private AI assistant. Be helpful, accurate, and concise."];
  if (personality && personality !== "default") systemPrompts.push(`Personality mode: ${personality}`);
  if (deepResearch) systemPrompts.push("The user has requested deep research. Provide thorough, well-structured analysis with citations where possible.");

  const chatMessages = [{ role: "system", content: systemPrompts.join("\n\n") }, ...messages];

  try {
    const providerResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: resolvedModel,
        messages: chatMessages,
        stream,
        max_tokens: deepResearch ? 8192 : 4096,
      }),
    });

    if (!providerResponse.ok) {
      const errText = await providerResponse.text();
      return res.status(providerResponse.status).json({ error: `BYOK provider error: ${providerResponse.status} — ${errText.slice(0, 300)}` });
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Provider", `byok-${byokProvider}`);
      res.setHeader("X-Model", resolvedModel);
      
      const reader = providerResponse.body?.getReader();
      if (!reader) return res.status(500).json({ error: "Failed to read stream" });

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
      return;
    }

    const data = await providerResponse.json();
    return res.json({ ...data, _provider: `byok-${byokProvider}` });
  } catch (err: any) {
    return res.status(502).json({ error: `BYOK request failed: ${err.message}` });
  }
}

// ============================================================
// Main Chat Function
// ============================================================
export const chat = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") return;

    try {
      const authHeader = req.headers.authorization || "";
      const tokenMatch = authHeader.match(/^Bearer (.*)$/);
      let user: admin.auth.DecodedIdToken | null = null;

      if (tokenMatch) {
        try {
          user = await admin.auth().verifyIdToken(tokenMatch[1]);
        } catch (e) {
          // Token invalid, allow only BYOK
        }
      }

      const {
        messages,
        model,
        stream = true,
        personality,
        deepResearch,
        byokProvider,
        byokApiKey,
      } = req.body || {};

      if (byokProvider && byokApiKey) {
        return handleByokRequest({ byokProvider, byokApiKey, messages, model, stream, personality, deepResearch }, res);
      }

      if (!user) {
        return res.status(401).json({ error: "Unauthorized. Sign in or use BYOK mode." });
      }

      const db = admin.firestore();
      
      // Get user plan
      const profileDoc = await db.collection("profiles").doc(user.uid).get();
      const plan = profileDoc.data()?.plan || "free";
      const limits = PLANS[plan] || PLANS.free;

      // Check daily usage limits for free/pro plans
      if (limits.messagesPerDay > 0) {
        const today = new Date().toISOString().split("T")[0];
        const usageId = `${user.uid}_${today}`;
        const usageDoc = await db.collection("daily_usage").doc(usageId).get();
        const usageData = usageDoc.data();

        if (usageData && deepResearch && limits.deepResearchPerDay > 0 && usageData.deep_research >= limits.deepResearchPerDay) {
          return res.status(429).json({ error: "Daily deep research limit reached. Upgrade for more." });
        }
        if (usageData && usageData.messages >= limits.messagesPerDay) {
          return res.status(429).json({ error: "Daily message limit reached. Upgrade for unlimited." });
        }
      }

      const systemPrompts: string[] = ["You are ShadowTalk AI, a powerful and private AI assistant. Be helpful, accurate, and concise."];
      if (personality && personality !== "default") systemPrompts.push(`Personality mode: ${personality}`);
      if (deepResearch) systemPrompts.push("The user has requested deep research. Provide thorough, well-structured analysis with citations where possible.");

      const chatMessages = [{ role: "system", content: systemPrompts.join("\n\n") }, ...(messages || [])];

      let lastError = "";
      const requestedModel = model || "llama-3.3-70b-versatile";

      for (const provider of SHARED_POOL) {
        if (!provider.enabled()) continue;

        const resolvedModel = provider.resolveModel(requestedModel);
        const apiKey = provider.getKey();
        if (!apiKey) continue;

        try {
          const providerResponse = await fetch(provider.getUrl(), {
            method: "POST",
            headers: provider.getHeaders(apiKey),
            body: JSON.stringify({
              model: resolvedModel,
              messages: chatMessages,
              stream,
              max_tokens: deepResearch ? 8192 : 4096,
            }),
          });

          if (!providerResponse.ok) {
            const errText = await providerResponse.text();
            const errMsg = provider.parseError(providerResponse.status, errText);
            console.warn(`[SharedPool] ${provider.name} error:`, errMsg);
            lastError = errMsg;

            if (provider.isRateLimit(providerResponse.status, errText)) {
              console.log(`[SharedPool] ${provider.name} rate limited, falling back...`);
              continue;
            }
            continue;
          }

          console.log(`[SharedPool] Using ${provider.name} for model ${resolvedModel}`);

          // Log usage (fire and forget)
          db.collection("usage_analytics").add({
            user_id: user.uid,
            action_type: deepResearch ? "deep_research" : "chat_message",
            feature_used: `${provider.id}:${resolvedModel}`,
            created_at: admin.firestore.FieldValue.serverTimestamp()
          }).catch(console.error);

          // Increment daily usage
          const today = new Date().toISOString().split("T")[0];
          const usageId = `${user.uid}_${today}`;
          db.collection("daily_usage").doc(usageId).set({
            user_id: user.uid,
            usage_date: today,
            messages: admin.firestore.FieldValue.increment(1),
            deep_research: admin.firestore.FieldValue.increment(deepResearch ? 1 : 0),
          }, { merge: true }).catch(console.error);

          if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Provider", provider.id);
            res.setHeader("X-Model", resolvedModel);

            const reader = providerResponse.body?.getReader();
            if (!reader) throw new Error("Failed to read stream");
            
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(decoder.decode(value, { stream: true }));
            }
            res.end();
            return;
          }

          const data = await providerResponse.json();
          return res.json({ ...data, _provider: provider.id });
        } catch (err: any) {
          console.warn(`[SharedPool] ${provider.name} exception:`, err);
          lastError = err.message || String(err);
          continue;
        }
      }

      return res.status(503).json({ error: `All providers exhausted or unconfigured. ${lastError}` });
    } catch (err: any) {
      console.error("Chat function error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// ============================================================
// Audio Generation Mock
// ============================================================
export const audio = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") return;

    try {
      const authHeader = req.headers.authorization || "";
      const tokenMatch = authHeader.match(/^Bearer (.*)$/);
      if (!tokenMatch) return res.status(401).json({ error: "Unauthorized" });
      await admin.auth().verifyIdToken(tokenMatch[1]);

      const { prompt, duration, type } = req.body || {};

      // Mock delay to simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const audioUrl = "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg";

      return res.json({ audioUrl, prompt, type, duration });
    } catch (err: any) {
      console.error("Audio generation error:", err);
      return res.status(500).json({ error: "Audio generation failed" });
    }
  });
});

// ============================================================
// Google Drive Mock
// ============================================================
export const drive = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") return;

    try {
      const authHeader = req.headers.authorization || "";
      const tokenMatch = authHeader.match(/^Bearer (.*)$/);
      if (!tokenMatch) return res.status(401).json({ error: "Unauthorized" });
      await admin.auth().verifyIdToken(tokenMatch[1]);

      const { action, params } = req.body || {};

      if (action === "drive.list") {
        return res.json({
          data: [
            { id: "mock-1", name: "Q3 Strategy Presentation.pptx", mimeType: "presentation", modifiedTime: new Date().toISOString() },
            { id: "mock-2", name: "Financial Projections 2024.xlsx", mimeType: "spreadsheet", modifiedTime: new Date(Date.now() - 86400000).toISOString() },
            { id: "mock-3", name: "Product Requirements Doc.docx", mimeType: "document", modifiedTime: new Date(Date.now() - 7 * 86400000).toISOString() },
          ]
        });
      }

      if (action === "drive.get") {
        const fileId = params?.fileId;
        return res.json({
          data: {
            content: `# Mock File\n\n[Imported mock content from Google Drive for file ID: ${fileId}]`
          }
        });
      }

      return res.status(400).json({ error: "Unknown action" });
    } catch (err: any) {
      console.error("Drive action error:", err);
      return res.status(500).json({ error: "Drive action failed" });
    }
  });
});

// ============================================================
// Genkit Flow for shadow-scale-orchestrator
// ============================================================
const ActionPlanSchema = z.object({
  actionType: z.enum(["investigate", "code", "deploy"]),
  confidenceScore: z.number().min(0).max(100),
  payload: z.any()
});

export const shadowScaleOrchestrator = onCallGenkit({
  authPolicy: () => {
    return true; // By default, allowing all for now since the original function didn't strictly require valid auth
  }
}, ai.defineFlow({
  name: "shadowScaleOrchestrator",
  inputSchema: z.any(),
  outputSchema: ActionPlanSchema
}, async (input: any) => {
  // Try to parse input if possible, though Genkit handles some typed input. 
  // Let's assume input is loosely GrowthSignalSchema structure
  const result = await ai.generate({
    model: gemini15Flash,
    prompt: `Analyze these growth signals and output an action plan: ${JSON.stringify(input)}`,
    output: { schema: ActionPlanSchema }
  });
  if (!result.output) {
    throw new Error("Failed to generate action plan");
  }
  return result.output;
}));

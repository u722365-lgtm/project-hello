// ShadowTalk AI — public MCP server (hand-authored, self-contained Deno function).
// Serves MCP Streamable HTTP JSON-RPC plus simple /.mcp/* helper endpoints.

import { FAQS, FEATURES, PLANS, PRODUCT, PRODUCT_CHANGELOG } from "./data.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type ToolResult = { content: Array<{ type: "text"; text: string }>; structuredContent?: unknown };

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, boolean>;
  handler: (input: Record<string, any>) => ToolResult;
};

const readOnly = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };

const TOOLS: Tool[] = [
  {
    name: "get_product_overview",
    title: "Get product overview",
    description:
      "Return an overview of ShadowTalk AI: what it is, who built it, the free tier, privacy posture and pricing plans.",
    inputSchema: {
      type: "object",
      properties: {
        includePricing: { type: "boolean", description: "Include the full pricing plan breakdown. Defaults to true." },
      },
      additionalProperties: false,
    },
    annotations: readOnly,
    handler: ({ includePricing = true }) => {
      const lines = [
        `# ${PRODUCT.name}`,
        PRODUCT.tagline,
        "",
        `Website: ${PRODUCT.website}`,
        `Founder: ${PRODUCT.founder}`,
        `Free tier: ${PRODUCT.freeTier}`,
        `Privacy: ${PRODUCT.privacy}`,
      ];
      if (includePricing) {
        lines.push("", "## Plans");
        for (const plan of PLANS) lines.push(`- **${plan.name}** (${plan.price}): ${plan.highlights.join(", ")}`);
      }
      return {
        content: [{ type: "text", text: lines.join("\n") }],
        structuredContent: { product: PRODUCT, plans: includePricing ? PLANS : undefined },
      };
    },
  },
  {
    name: "list_features",
    title: "List features",
    description:
      "List ShadowTalk AI features with their category, in-app route and a short description. Optionally filter by keyword or category.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text keyword to filter features by name or description." },
        category: { type: "string", description: "Filter by category, e.g. chat, research, security, code, privacy, platform." },
      },
      additionalProperties: false,
    },
    annotations: readOnly,
    handler: ({ query, category }) => {
      const q = typeof query === "string" ? query.trim().toLowerCase() : "";
      const cat = typeof category === "string" ? category.trim().toLowerCase() : "";
      const matches = FEATURES.filter((f) => {
        const inCategory = !cat || f.category.toLowerCase() === cat;
        const inQuery = !q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
        return inCategory && inQuery;
      });
      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No features matched. Available categories: ${[...new Set(FEATURES.map((f) => f.category))].join(", ")}`,
            },
          ],
          structuredContent: { features: [] },
        };
      }
      return {
        content: [
          {
            type: "text",
            text: matches
              .map((f) => `- **${f.name}** (${f.category}) — ${f.description}\n  ${PRODUCT.website}${f.route}`)
              .join("\n"),
          },
        ],
        structuredContent: { features: matches },
      };
    },
  },
  {
    name: "get_changelog",
    title: "Get changelog",
    description: "Return recent ShadowTalk AI release notes: version, title, summary and the individual changes.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", description: "How many recent releases to return (1-20, default 5)." } },
      additionalProperties: false,
    },
    annotations: readOnly,
    handler: ({ limit }) => {
      const parsed = Number(limit);
      const count = Math.min(Math.max(Math.trunc(Number.isFinite(parsed) ? parsed : 5), 1), 20);
      const entries = PRODUCT_CHANGELOG.slice(0, count);
      const text = entries
        .map((entry) => {
          const changes = entry.changes.map((c) => `  - [${c.type}] ${c.text}`).join("\n");
          return `## ${entry.version} — ${entry.title} (${entry.publishedAt})\n${entry.summary}\n${changes}`;
        })
        .join("\n\n");
      return { content: [{ type: "text", text }], structuredContent: { releases: entries } };
    },
  },
  {
    name: "answer_faq",
    title: "Answer FAQ",
    description:
      "Search ShadowTalk AI's published FAQ (pricing, accounts, privacy, offline use, supported platforms) and return matching answers.",
    inputSchema: {
      type: "object",
      properties: { question: { type: "string", description: "The question to look up. Omit to return every FAQ entry." } },
      additionalProperties: false,
    },
    annotations: readOnly,
    handler: ({ question }) => {
      const q = typeof question === "string" ? question.trim().toLowerCase() : "";
      const words = q ? q.split(/\W+/).filter((w) => w.length > 3) : [];
      const hits = words.length
        ? FAQS.map((faq) => {
            const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
            return { faq, score: words.filter((w) => haystack.includes(w)).length };
          })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((s) => s.faq)
        : FAQS;
      const results = hits.length > 0 ? hits : FAQS;
      return {
        content: [{ type: "text", text: results.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n") }],
        structuredContent: { faqs: results, matched: hits.length > 0 && words.length > 0 },
      };
    },
  },
];

const SERVER_INFO = { name: "shadowtalk-ai", title: "ShadowTalk-AI", version: "0.1.0" };
const INSTRUCTIONS =
  "Public tools that expose ShadowTalk AI's published product information. Use `get_product_overview` for what the product is and how it is priced, `list_features` to explore features and their in-app routes, `get_changelog` for recent releases, and `answer_faq` for common questions. These tools return public marketing/product data only — no user accounts or private data.";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toolDescriptor = (t: Tool) => ({
  name: t.name,
  title: t.title,
  description: t.description,
  inputSchema: t.inputSchema,
  annotations: t.annotations,
});

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function handleRpc(message: any): unknown | null {
  const { id, method, params } = message ?? {};
  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS.map(toolDescriptor) });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const result = tool.handler(params?.arguments ?? {});
        return rpcResult(id, result);
      } catch (error) {
        return rpcResult(id, {
          content: [{ type: "text", text: error instanceof Error ? error.message : "Tool failed" }],
          isError: true,
        });
      }
    }
    default:
      if (typeof method === "string" && method.startsWith("notifications/")) return null;
      return rpcError(id ?? null, -32601, `Method not found: ${method}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/mcp/, "").replace(/\/+$/, "");

  if (path === "/.well-known/oauth-protected-resource") {
    return json({ resource: url.origin + "/functions/v1/mcp", authorization_servers: [] });
  }

  if (path === "/.mcp/list-tools") {
    return json({ server: SERVER_INFO, instructions: INSTRUCTIONS, tools: TOOLS.map(toolDescriptor) });
  }

  if (path.startsWith("/.mcp/invoke-tool/")) {
    const name = decodeURIComponent(path.slice("/.mcp/invoke-tool/".length));
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return json({ error: `Unknown tool: ${name}` }, 404);
    let input: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        input = (await req.json()) ?? {};
      } catch {
        input = {};
      }
    }
    try {
      return json(tool.handler(input as Record<string, any>));
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Tool failed" }, 500);
    }
  }

  if (req.method === "GET") {
    return json({ server: SERVER_INFO, instructions: INSTRUCTIONS, tools: TOOLS.map((t) => t.name) });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }

  if (Array.isArray(payload)) {
    const responses = payload.map(handleRpc).filter((r) => r !== null);
    if (responses.length === 0) return new Response(null, { status: 202, headers: corsHeaders });
    return json(responses);
  }

  const response = handleRpc(payload);
  if (response === null) return new Response(null, { status: 202, headers: corsHeaders });
  return json(response);
});

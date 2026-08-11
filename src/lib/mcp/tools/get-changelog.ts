import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { PRODUCT_CHANGELOG } from "@/content/productChangelog";

export default defineTool({
  name: "get_changelog",
  title: "Get changelog",
  description:
    "Return recent ShadowTalk AI release notes: version, title, summary and the individual changes.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many recent releases to return (1-20, default 5)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ limit }) => {
    const count = Math.min(Math.max(Math.trunc(limit ?? 5), 1), 20);
    const entries = PRODUCT_CHANGELOG.slice(0, count);

    const text = entries
      .map((entry) => {
        const changes = entry.changes
          .map((change) => `  - [${change.type}] ${change.text}`)
          .join("\n");
        return `## ${entry.version} — ${entry.title} (${entry.publishedAt})\n${entry.summary}\n${changes}`;
      })
      .join("\n\n");

    return {
      content: [{ type: "text", text }],
      structuredContent: { releases: entries },
    };
  },
});

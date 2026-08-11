import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { PLANS, PRODUCT } from "../data";

export default defineTool({
  name: "get_product_overview",
  title: "Get product overview",
  description:
    "Return an overview of ShadowTalk AI: what it is, who built it, the free tier, privacy posture and pricing plans.",
  inputSchema: {
    includePricing: z
      .boolean()
      .optional()
      .describe("Include the full pricing plan breakdown. Defaults to true."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
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
      for (const plan of PLANS) {
        lines.push(`- **${plan.name}** (${plan.price}): ${plan.highlights.join(", ")}`);
      }
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
      structuredContent: {
        product: PRODUCT,
        plans: includePricing ? PLANS : undefined,
      },
    };
  },
});

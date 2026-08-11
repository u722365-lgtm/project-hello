import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { FAQS } from "../data";

export default defineTool({
  name: "answer_faq",
  title: "Answer FAQ",
  description:
    "Search ShadowTalk AI's published FAQ (pricing, accounts, privacy, offline use, supported platforms) and return matching answers.",
  inputSchema: {
    question: z.string().optional().describe("The question to look up. Omit to return every FAQ entry."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ question }) => {
    const q = question?.trim().toLowerCase();
    const words = q ? q.split(/\W+/).filter((w) => w.length > 3) : [];

    const scored = FAQS.map((faq) => {
      const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
      const score = words.filter((w) => haystack.includes(w)).length;
      return { faq, score };
    });

    const hits = words.length
      ? scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.faq)
      : FAQS;

    const results = hits.length > 0 ? hits : FAQS;
    const text = results.map((faq) => `**${faq.question}**\n${faq.answer}`).join("\n\n");

    return {
      content: [{ type: "text", text }],
      structuredContent: { faqs: results, matched: hits.length > 0 && words.length > 0 },
    };
  },
});

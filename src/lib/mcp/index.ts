import { defineMcp } from "@lovable.dev/mcp-js";
import answerFaqTool from "./tools/answer-faq";
import getChangelogTool from "./tools/get-changelog";
import getProductOverviewTool from "./tools/get-product-overview";
import listFeaturesTool from "./tools/list-features";

export default defineMcp({
  name: "shadowtalk-ai",
  title: "ShadowTalk-AI",
  version: "0.1.0",
  instructions:
    "Public tools that expose ShadowTalk AI's published product information. Use `get_product_overview` for what the product is and how it is priced, `list_features` to explore features and their in-app routes, `get_changelog` for recent releases, and `answer_faq` for common questions. These tools return public marketing/product data only — no user accounts or private data.",
  tools: [getProductOverviewTool, listFeaturesTool, getChangelogTool, answerFaqTool],
});

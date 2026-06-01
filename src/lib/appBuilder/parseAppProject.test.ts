import { describe, expect, it } from "vitest";
import { parseAppProjectResponse } from "./parseAppProject";

describe("parseAppProjectResponse", () => {
  it("parses fenced JSON", () => {
    const raw = `Here is the project:
\`\`\`json
{
  "title": "Todo App",
  "platform": "web",
  "files": [
    { "name": "index.html", "language": "html", "content": "<html></html>" },
    { "name": "style.css", "language": "css", "content": "body{}" }
  ]
}
\`\`\``;
    const project = parseAppProjectResponse(raw, "web");
    expect(project?.title).toBe("Todo App");
    expect(project?.files.length).toBeGreaterThanOrEqual(2);
    expect(project?.files.some((f) => f.name === "index.html")).toBe(true);
  });

  it("returns null for invalid JSON", () => {
    expect(parseAppProjectResponse("not json", "web")).toBeNull();
  });
});

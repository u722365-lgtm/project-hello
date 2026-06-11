import { describe, expect, it } from "vitest";
import {
  applyJulesChangesToFiles,
  parseNewFilesFromUnidiff,
} from "./parseJulesPatch";

const NEW_FILE_PATCH = `diff --git a/index.html b/index.html
new file mode 100644
--- /dev/null
+++ b/index.html
@@ -0,0 +1,3 @@
+<html>
+<body>Hello Jules</body>
+</html>`;

describe("parseNewFilesFromUnidiff", () => {
  it("extracts new file content from unified diff", () => {
    const files = parseNewFilesFromUnidiff(NEW_FILE_PATCH);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("index.html");
    expect(files[0].content).toContain("Hello Jules");
    expect(files[0].isNew).toBe(true);
  });
});

describe("applyJulesChangesToFiles", () => {
  it("maps new files from session activities", () => {
    const changes = applyJulesChangesToFiles(
      [
        {
          artifacts: [
            {
              changeSet: {
                gitPatch: { unidiffPatch: NEW_FILE_PATCH },
              },
            },
          ],
        },
      ],
      [{ name: "style.css", content: "body {}" }],
    );
    expect(changes.some((c) => c.path === "index.html")).toBe(true);
  });
});

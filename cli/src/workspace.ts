import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);
const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".html", ".css", ".scss",
  ".py", ".go", ".rs", ".java", ".sql", ".yaml", ".yml", ".toml", ".sh",
]);

export type WorkspaceFile = { name: string; content: string; language?: string };

export function collectWorkspaceFiles(dir: string, maxFiles = 40): WorkspaceFile[] {
  const files: WorkspaceFile[] = [];
  const root = dir;

  function walk(current: string) {
    if (files.length >= maxFiles) return;
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const full = join(current, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full);
      } else if (st.isFile()) {
        const ext = entry.includes(".") ? `.${entry.split(".").pop()}` : "";
        if (!TEXT_EXT.has(ext) && st.size > 200_000) continue;
        if (st.size > 500_000) continue;
        try {
          const content = readFileSync(full, "utf8");
          const name = relative(root, full) || entry;
          files.push({ name, content, language: ext.slice(1) || "text" });
        } catch {
          // binary or unreadable
        }
      }
    }
  }

  walk(root);
  return files;
}

const MAX_FILE_CHARS = 24_000;
const MAX_TOTAL_CHARS = 100_000;

export function buildWorkspacePrompt(
  task: string,
  files: WorkspaceFile[],
  activeFileName?: string,
): string {
  let total = 0;
  const blocks: string[] = [];

  for (const file of files) {
    let content = file.content;
    if (content.length > MAX_FILE_CHARS) {
      content = `${content.slice(0, MAX_FILE_CHARS)}\n… [truncated]`;
    }
    const block = `=== FILE: ${file.name} ===\n${content}`;
    if (total + block.length > MAX_TOTAL_CHARS) break;
    blocks.push(block);
    total += block.length;
  }

  const focus = activeFileName ? `\nFocus file: ${activeFileName}\n` : "";

  return `You are ShadowTalk CLI — a sovereign on-device coding agent.

TASK:
${task.trim()}
${focus}
WORKSPACE (${blocks.length} files):
${blocks.join("\n\n")}

Respond with the complete updated code or clear instructions. For code changes, output raw code only when asked to apply changes.`;
}

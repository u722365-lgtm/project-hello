import type { JulesWorkspaceFile } from "./types";

const MAX_FILE_CHARS = 24_000;
const MAX_TOTAL_CHARS = 100_000;

/** Embed IDE workspace files into a Jules repoless session prompt. */
export function buildWorkspacePrompt(
  task: string,
  files: JulesWorkspaceFile[],
  activeFileName?: string,
): string {
  let total = 0;
  const blocks: string[] = [];

  for (const file of files) {
    let content = file.content;
    if (content.length > MAX_FILE_CHARS) {
      content = `${content.slice(0, MAX_FILE_CHARS)}\n… [truncated ${content.length - MAX_FILE_CHARS} chars]`;
    }
    const block = `=== FILE: ${file.name} (${file.language ?? "text"}) ===\n${content}`;
    if (total + block.length > MAX_TOTAL_CHARS) break;
    blocks.push(block);
    total += block.length;
  }

  const focus = activeFileName
    ? `\nThe user is currently editing: ${activeFileName}\n`
    : "";

  return `You are an autonomous coding agent working inside ShadowTalk IDE (in-browser Monaco editor).

TASK:
${task.trim()}
${focus}
WORKSPACE (${blocks.length} file${blocks.length === 1 ? "" : "s"}):
${blocks.join("\n\n")}

Instructions:
- Modify or create files as needed to complete the task.
- Prefer minimal, focused changes.
- Ensure code runs in the browser where applicable (HTML/CSS/JS).
- Return complete file outputs via your change set when done.`;
}

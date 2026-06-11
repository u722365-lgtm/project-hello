import type { JulesActivity, ParsedFileChange } from "./types";

/** Collect non-empty unified diff patches from session activities (last wins per file). */
export function extractPatchesFromActivities(activities: JulesActivity[]): string[] {
  const patches: string[] = [];
  for (const act of activities) {
    for (const art of act.artifacts ?? []) {
      const patch = art.changeSet?.gitPatch?.unidiffPatch?.trim();
      if (patch) patches.push(patch);
    }
  }
  return patches;
}

/** Parse new files from unified diff (--- /dev/null). */
export function parseNewFilesFromUnidiff(patch: string): ParsedFileChange[] {
  const results: ParsedFileChange[] = [];
  const chunks = patch.split(/^diff --git /m).filter(Boolean);

  for (const chunk of chunks) {
    const full = chunk.startsWith("diff --git ") ? chunk : `diff --git ${chunk}`;
    if (!full.includes("--- /dev/null")) continue;

    const pathMatch = full.match(/\+\+\+ b\/(.+?)(?:\n|$)/);
    if (!pathMatch) continue;

    const path = pathMatch[1].trim();
    const lines = full.split("\n");
    const contentLines: string[] = [];
    let inHunk = false;

    for (const line of lines) {
      if (line.startsWith("@@")) {
        inHunk = true;
        continue;
      }
      if (!inHunk) continue;
      if (line.startsWith("diff --git ")) break;
      if (line.startsWith("+") && !line.startsWith("+++")) {
        contentLines.push(line.slice(1));
      }
    }

    if (contentLines.length > 0) {
      results.push({ path, content: contentLines.join("\n"), isNew: true });
    }
  }

  return results;
}

/** Apply simple unified diff hunks to existing file content (best-effort). */
export function applyUnidiffToContent(original: string, patch: string, filePath: string): string | null {
  const basename = filePath.split("/").pop() ?? filePath;
  const chunks = patch.split(/^diff --git /m).filter(Boolean);

  for (const chunk of chunks) {
    const full = chunk.startsWith("diff --git ") ? chunk : `diff --git ${chunk}`;
    const pathMatch = full.match(/\+\+\+ b\/(.+?)(?:\n|$)/);
    if (!pathMatch) continue;

    const path = pathMatch[1].trim();
    if (path !== filePath && path !== basename && !filePath.endsWith(path)) continue;

    if (full.includes("--- /dev/null")) {
      const parsed = parseNewFilesFromUnidiff(full.startsWith("diff --git ") ? full : `diff --git ${full}`);
      const hit = parsed.find((p) => p.path === path);
      if (hit) return hit.content;
      continue;
    }

    const origLines = original.split("\n");
    const lines = full.split("\n");
    let i = 0;
    let lineIdx = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line.startsWith("@@")) {
        i++;
        continue;
      }

      const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (!hunk) {
        i++;
        continue;
      }

      lineIdx = Math.max(0, parseInt(hunk[1], 10) - 1);
      i++;

      while (i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("diff --git ")) {
        const hunkLine = lines[i];
        if (hunkLine.startsWith(" ")) {
          lineIdx++;
        } else if (hunkLine.startsWith("-")) {
          origLines.splice(lineIdx, 1);
        } else if (hunkLine.startsWith("+")) {
          origLines.splice(lineIdx, 0, hunkLine.slice(1));
          lineIdx++;
        }
        i++;
      }
    }

    return origLines.join("\n");
  }

  return null;
}

export function applyJulesChangesToFiles(
  activities: JulesActivity[],
  files: Array<{ name: string; content: string }>,
): ParsedFileChange[] {
  const patches = extractPatchesFromActivities(activities);
  if (patches.length === 0) return [];

  const combined = patches[patches.length - 1];
  const changes: ParsedFileChange[] = [];
  const seen = new Set<string>();

  for (const change of parseNewFilesFromUnidiff(combined)) {
    const targetName = files.find((f) => f.name === change.path || f.name.endsWith(change.path))?.name ?? change.path;
    if (!seen.has(targetName)) {
      changes.push({ ...change, path: targetName });
      seen.add(targetName);
    }
  }

  for (const file of files) {
    if (seen.has(file.name)) continue;
    for (const patch of patches) {
      const updated = applyUnidiffToContent(file.content, patch, file.name);
      if (updated !== null && updated !== file.content) {
        changes.push({ path: file.name, content: updated, isNew: false });
        seen.add(file.name);
        break;
      }
    }
  }

  return changes;
}

export function getLatestActivityTitle(activities: JulesActivity[]): string | null {
  for (let i = activities.length - 1; i >= 0; i--) {
    const title = activities[i].progressUpdated?.title;
    if (title?.trim()) return title.trim();
  }
  return null;
}

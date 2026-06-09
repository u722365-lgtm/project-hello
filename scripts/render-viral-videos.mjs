#!/usr/bin/env node
/**
 * Render all ShadowTalk viral short hook variants to remotion/out/
 * Requires: cd remotion && npm install (once)
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const remotionDir = join(root, "remotion");

if (!existsSync(join(remotionDir, "node_modules"))) {
  console.error("Run: cd remotion && npm install");
  process.exit(1);
}

const variants = [
  { name: "privacy", out: "viral-privacy.mp4" },
  { name: "developer", out: "viral-developer.mp4" },
  { name: "student", out: "viral-student.mp4" },
];

console.log("▶ Generating voiceover tracks…");
const vo = spawnSync("node", ["scripts/generate-viral-voiceover.mjs", ...variants.map((v) => v.name)], {
  cwd: root,
  stdio: "inherit",
});
if (vo.status !== 0) process.exit(vo.status ?? 1);

for (const v of variants) {
  console.log(`\n▶ Rendering ${v.name} → remotion/out/${v.out}`);
  const r = spawnSync(
    "npx",
    [
      "remotion",
      "render",
      "src/index.ts",
      "ViralShort",
      `out/${v.out}`,
      `--props=${JSON.stringify({ hookVariant: v.name })}`,
    ],
    { cwd: remotionDir, stdio: "inherit", shell: true },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("\n✓ All variants rendered to remotion/out/");

#!/usr/bin/env node
/**
 * Copy electron-builder output to public/downloads/ with canonical filenames
 * and refresh manifest.json for the /downloads page.
 */
import { createHash } from "crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "electron", "dist");
const outDir = join(root, "public", "downloads");

const INSTALLERS = {
  windows: { filename: "shadowtalk-setup.exe", match: /\.exe$/i },
  mac: { filename: "shadowtalk-setup.dmg", match: /\.dmg$/i },
  linux: { filename: "shadowtalk-setup.AppImage", match: /\.AppImage$/i },
};

function readVersion() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  return pkg.version ?? "1.0.0";
}

function sha256File(path) {
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

function findInDist(match) {
  if (!existsSync(distDir)) return null;

  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        const found = walk(p);
        if (found) return found;
      } else if (match.test(name)) {
        return p;
      }
    }
    return null;
  }

  return walk(distDir);
}

function stageOne(platform, { filename, match }) {
  const src = findInDist(match);
  if (!src) {
    console.warn(`[desktop:stage] No ${platform} installer in electron/dist/ (expected *${match})`);
    return { available: false, sizeBytes: null, sha256: null, filename };
  }
  mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, filename);
  copyFileSync(src, dest);
  const stat = statSync(dest);
  const hash = sha256File(dest);
  console.log(`[desktop:stage] ${platform}: ${filename} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  return {
    available: true,
    sizeBytes: stat.size,
    sha256: hash,
    filename,
  };
}

const version = readVersion();
const manifest = {
  version,
  releasedAt: new Date().toISOString().slice(0, 10),
  installers: {},
  fallbackReleaseUrl:
    "https://github.com/zain836/shadowtalk-ai-903ca615/releases/latest",
};

for (const [platform, spec] of Object.entries(INSTALLERS)) {
  const staged = stageOne(platform, spec);
  manifest.installers[platform] = {
    filename: spec.filename,
    websiteUrl: `/downloads/${spec.filename}`,
    ...staged,
  };
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("[desktop:stage] manifest.json updated");

const anyStaged = Object.values(manifest.installers).some((i) => i.available);
if (!anyStaged) {
  console.error(
    "[desktop:stage] No installers copied. Run `npm run desktop:make` on Windows/macOS/Linux first.",
  );
  process.exit(1);
}

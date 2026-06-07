#!/usr/bin/env node
/**
 * Locally regenerates the remediated ShadowTalk presentation from the broken QA fixture.
 * Run: npm run remediate:deck
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "artifacts");
const outFile = join(outDir, "shadowtalk-presentation-remediated.json");

async function main() {
  const server = await createServer({
    root,
    configFile: join(root, "vite.config.ts"),
    server: { middlewareMode: true },
  });

  try {
    const mod = await server.ssrLoadModule("/src/lib/presentation/fixtures/shadowtalkBrokenDeck.ts");
    const quality = await server.ssrLoadModule("/src/lib/presentation/slideQuality.ts");

    const theme = {
      bg: "#09090B",
      accent: "#FBBF24",
      accentEnd: "#F59E0B",
      text: "#FAFAFA",
      secondaryBg: "#18181B",
      cardBg: "#1C1C1E",
      mutedText: "#A1A1AA",
    };

    const remediated = quality.postProcessPresentation(
      { ...mod.shadowtalkBrokenDeck },
      theme,
    );

    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify(remediated, null, 2));

    const checks = {
      slides: remediated.slides.length,
      hasFlexLayout: remediated.slides.every((s) => s.html.includes("flex-direction:column")),
      hasNarrowContent: remediated.slides.every((s) => s.html.includes("max-width:640px")),
      workflowDiagram: remediated.slides[3]?.html.includes("Plan"),
      statsVisuals: /font-weight:800|<rect/.test(remediated.slides[2]?.html || ""),
      scriptInNotes: remediated.slides[0]?.speakerNotes?.length > 0,
    };

    console.log("Remediated deck written to:", outFile);
    console.log("Validation:", checks);
    if (!Object.values(checks).every(Boolean)) {
      process.exit(1);
    }
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

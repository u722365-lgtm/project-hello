import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const checks = [];
let failed = 0;

function assert(name, condition, detail = "") {
  checks.push({ name, pass: !!condition, detail });
  if (!condition) failed++;
}

try {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert("canonical https://www.shadowtalk-ai.com/", html.includes('rel="canonical" href="https://www.shadowtalk-ai.com/"'));
  assert("hreflang en", html.includes('hreflang="en"'));
  assert("hreflang es", html.includes('hreflang="es"'));
  assert("hreflang fr", html.includes('hreflang="fr"'));
  assert("hreflang de", html.includes('hreflang="de"'));
  assert("hreflang x-default", html.includes('hreflang="x-default"'));
  assert("og:title present", html.includes('property="og:title"'));
  assert("og:image present", html.includes('property="og:image"'));
  assert("twitter:title present", html.includes('name="twitter:title"'));
  assert("twitter:image present", html.includes('name="twitter:image"'));
  assert("json-ld present", html.includes('application/ld+json'));
} catch (e) {
  assert("index.html readable", false, e.message);
}

try {
  const robots = readFileSync(resolve(root, "public/robots.txt"), "utf8");
  assert("robots sitemap normal", robots.includes("Sitemap: https://www.shadowtalk-ai.com/sitemap.xml"));
  assert("robots sitemap aeo", robots.includes("Sitemap: https://www.shadowtalk-ai.com/aeo-sitemap.xml"));
  assert("robots gpt allow", /User-agent:\s*GPTBot\s*\nAllow:\s*\//.test(robots));
  assert("robots claude allow", /User-agent:\s*ClaudeBot\s*\nAllow:\s*\//.test(robots));
} catch (e) {
  assert("robots.txt readable", false, e.message);
}

try {
  const sx = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");
  assert("sitemap.xml has urls", (sx.match(/<url>/g) || []).length > 0);
} catch (e) {
  assert("sitemap.xml readable", false, e.message);
}

try {
  const ax = readFileSync(resolve(root, "public/aeo-sitemap.xml"), "utf8");
  assert("aeo-sitemap.xml has urls", (ax.match(/<url>/g) || []).length > 0);
} catch (e) {
  assert("aeo-sitemap.xml readable", false, e.message);
}

console.log(JSON.stringify({ summary: { total: checks.length, failed, passed: checks.length - failed }, checks }, null, 2));
if (failed) process.exit(1);

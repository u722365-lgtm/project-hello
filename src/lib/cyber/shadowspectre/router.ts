import type { ShadowSpectreHead } from "./types";

const ROUTE_RULES: { head: ShadowSpectreHead; patterns: RegExp[] }[] = [
  { head: "recon", patterns: [/\b(recon|osint|subdomain|amass|nmap|shodan|enumerate|fingerprint)\b/i] },
  { head: "exploit", patterns: [/\b(exploit|payload|sqli|xss|ssrf|rce|idor|shell|privesc|lateral|metasploit)\b/i] },
  { head: "blue", patterns: [/\b(sigma|yara|detect|detection|siem|soc|hunt|blue team|defender)\b/i] },
  { head: "ir", patterns: [/\b(incident|forensic|triage|contain|ioc|malware|root cause|ir\b)\b/i] },
  { head: "intel", patterns: [/\b(cve-|cve\d|cvss|mitre|att&ck|threat intel|zero-?day|actor)\b/i] },
  { head: "report", patterns: [/\b(report|write-?up|executive summary|bug bounty submission|pentest report)\b/i] },
  { head: "grc", patterns: [/\b(soc2|iso\s*27001|pci|hipaa|compliance|audit|grc|risk register)\b/i] },
  { head: "harden", patterns: [/\b(harden|remediat|cis benchmark|patch|waf|posture|secure config)\b/i] },
];

export function normalizeShadowSpectreHead(value?: string | null): ShadowSpectreHead | null {
  if (!value) return null;
  const v = value.toLowerCase() as ShadowSpectreHead;
  const valid: ShadowSpectreHead[] = [
    "general", "recon", "exploit", "blue", "ir", "intel", "report", "grc", "harden",
  ];
  return valid.includes(v) ? v : null;
}

export function routeShadowSpectreHead(
  userMessage: string,
  explicitHead?: string | null,
): ShadowSpectreHead {
  const explicit = normalizeShadowSpectreHead(explicitHead);
  if (explicit && explicit !== "general") return explicit;

  const text = userMessage.trim();
  if (!text) return explicit ?? "general";

  for (const rule of ROUTE_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.head;
  }
  return explicit ?? "general";
}

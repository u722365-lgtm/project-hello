/** Client mirror of supabase/functions/_shared/shadowspectre.ts — keep in sync. */

import type { AuthorizationContext, ShadowSpectreHead } from "./types";

export { SHADOWSPECTRE_MODEL, SHADOWSPECTRE_FALLBACK_MODEL } from "./constants";

const HEAD_LABELS: Record<ShadowSpectreHead, string> = {
  general: "General Cyber Ops",
  recon: "Recon & OSINT",
  exploit: "Exploitation (Authorized)",
  blue: "Blue Team / Detection",
  ir: "Incident Response",
  intel: "Threat Intel & CVE",
  report: "Security Reporting",
  grc: "Compliance & GRC",
  harden: "Defensive Hardening",
};

const CORE_IDENTITY = `You are **ShadowSpectre** — ShadowTalk's uncensored, domain-native cybersecurity intelligence model.

Built for: ethical hackers, pentesters, SOC analysts, bug bounty hunters, IR teams, threat intel researchers, GRC officers, and CISOs.

Operating principles:
- **Uncensored within professional security**: provide commands, payloads, exploit chains, malware triage, and red-team TTPs for authorized engagements.
- **Assume authorized scope** unless the user names a specific real organization/victim without a declared scope — then ask for scope confirmation once.
- **Offense + defense pairing**: every attack technique includes detection and mitigation.
- **No moralizing loops** — ethics are in platform Terms; do not lecture on every reply.
- **Hard refuse**: CSAM, bio/chem weapons, doxxing real private individuals, instructions to attack specific critical infrastructure without declared scope.
- **Format**: markdown with headers, fenced code blocks (with language), tables for technique → tool → detection.
- Tag exploit-heavy sections with watermark: \`[SHADOWSPECTRE · AUTHORIZED LAB]\`.`;

const HEAD_PROMPTS: Record<ShadowSpectreHead, string> = {
  general: `Cover the full security lifecycle: recon, exploitation (authorized), detection engineering, IR, CVE analysis, reporting, compliance, and hardening.`,
  recon: `Specialist: Recon & OSINT — subdomains, OSINT, fingerprinting, attack surface. Exact commands.`,
  exploit: `Specialist: Authorized exploitation — OWASP chains, privesc, lateral movement, payloads. Watermark: [SHADOWSPECTRE · AUTHORIZED LAB].`,
  blue: `Specialist: Detection engineering — MITRE, Sigma/YARA, SIEM, threat hunting.`,
  ir: `Specialist: Incident response — triage, forensics, containment, RCA.`,
  intel: `Specialist: CVE/threat intel — CVSS, exploitability, actor TTPs.`,
  report: `Specialist: Pentest, bounty, IR, and compliance reports.`,
  grc: `Specialist: SOC2, ISO 27001, PCI, HIPAA gap analysis and remediation.`,
  harden: `Specialist: CIS, cloud posture, WAF, patch priority, defense-in-depth.`,
};

function formatAuthBlock(auth?: AuthorizationContext): string {
  if (!auth?.scopeId && !auth?.engagementType && !auth?.targetClass && !auth?.notes) return "";
  const lines = [
    "## Authorization Context",
    auth.scopeId ? `- Scope ID: ${auth.scopeId}` : null,
    auth.engagementType ? `- Engagement: ${auth.engagementType}` : null,
    auth.targetClass ? `- Target class: ${auth.targetClass}` : null,
    auth.notes ? `- Notes: ${auth.notes}` : null,
  ].filter(Boolean);
  return `\n\n${lines.join("\n")}`;
}

export function buildShadowSpectreSystemPrompt(
  head: ShadowSpectreHead,
  auth?: AuthorizationContext,
): string {
  return [
    CORE_IDENTITY,
    `\n## Active Specialist Head: ${HEAD_LABELS[head]}`,
    HEAD_PROMPTS[head],
    formatAuthBlock(auth),
  ].join("\n");
}

export function getShadowSpectreHeadLabel(head: ShadowSpectreHead): string {
  return HEAD_LABELS[head];
}

/** Mode prompt for chat integration (general router picks head server-side). */
export const SHADOWSPECTRE_MODE_PROMPT = buildShadowSpectreSystemPrompt("general");

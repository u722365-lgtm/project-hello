export type SecurityHubMode = "vault" | "score" | "audit" | "trust" | "cyber";

export const SECURITY_HUB_MODES: { id: SecurityHubMode; label: string; description: string }[] = [
  { id: "vault", label: "Vault", description: "Encrypted secrets" },
  { id: "score", label: "Privacy Score", description: "Live privacy rating" },
  { id: "audit", label: "Audit", description: "Security audit board" },
  { id: "trust", label: "Trust", description: "Cryptographic proofs" },
  { id: "cyber", label: "Cyber", description: "Threat intel & SOC" },
];

export function parseSecurityHubMode(value: string | null): SecurityHubMode {
  if (value === "score" || value === "audit" || value === "trust" || value === "cyber") return value;
  return "vault";
}

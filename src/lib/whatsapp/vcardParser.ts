// Lightweight vCard 2.1 / 3.0 / 4.0 parser for WhatsApp / phone contact exports.
// Returns deduped { name, phone } objects with E.164-ish normalized phones.

export interface ParsedContact {
  name: string;
  phone: string;
}

function normalizePhone(raw: string): string {
  // Keep leading + then digits only
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return "+" + cleaned.slice(1).replace(/\D/g, "");
  return cleaned.replace(/\D/g, "");
}

function unfold(text: string): string {
  // vCard line folding: lines starting with space/tab continue the previous line
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

export function parseVCard(text: string): ParsedContact[] {
  const unfolded = unfold(text);
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
  const out: ParsedContact[] = [];
  const seen = new Set<string>();

  for (const block of cards) {
    const body = block.split(/END:VCARD/i)[0] ?? "";
    const lines = body.split(/\r?\n/);

    let name = "";
    const phones: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const propRaw = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1).trim();
      const prop = propRaw.split(";")[0].toUpperCase();

      if (prop === "FN" && !name) {
        name = value.replace(/\\,/g, ",").trim();
      } else if (prop === "N" && !name) {
        // N: Family;Given;Middle;Prefix;Suffix
        const parts = value.split(";").map((p) => p.trim());
        const given = parts[1] || "";
        const family = parts[0] || "";
        name = `${given} ${family}`.trim();
      } else if (prop === "TEL") {
        const p = normalizePhone(value);
        if (p.length >= 7) phones.push(p);
      }
    }

    for (const p of phones) {
      if (seen.has(p)) continue;
      seen.add(p);
      out.push({ name: name || p, phone: p });
    }
  }

  return out;
}

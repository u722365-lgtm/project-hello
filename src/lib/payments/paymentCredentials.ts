/** Payment destination details — reveal only after user requests an invoice. */

export type PaymentMethodId = "bank" | "mobile" | "crypto" | "wire";

export const PAYMENT_CREDENTIALS = {
  bank: {
    bankName: "Meezan Bank",
    accountName: "ShadowTalk AI",
    accountNumber: "0099170112749131",
    iban: "PK08 MEZN 0099 1701 1274 9131",
    referencePrefix: "ShadowTalk",
  },
  mobile: {
    easypaisa: "03211798561",
    jazzcash: "03211798561",
    accountName: "ShadowTalk AI",
  },
  crypto: {
    usdt: "TKfKJ7ESFcnMTd2F1DkrvZ4buCWneAmHqz",
    network: "Tron (TRC20)",
  },
  wire: {
    swift: "MEZN PK KA",
    iban: "PK08 MEZN 0099 1701 1274 9131",
    bankName: "Meezan Bank Limited",
    accountName: "ShadowTalk AI",
  },
} as const;

export function maskIban(iban: string): string {
  const parts = iban.trim().split(/\s+/);
  if (parts.length < 2) return "•••• •••• •••• ••••";
  const tail = parts[parts.length - 1];
  return `${parts[0]} ${parts[1]} •••• •••• •••• ${tail.slice(-4)}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "•••• ••••";
  return `${digits.slice(0, 4)} ••• ••${digits.slice(-2)}`;
}

export function maskCryptoAddress(address: string): string {
  if (address.length < 12) return "••••••••";
  return `${address.slice(0, 4)}…${address.slice(-6)}`;
}

export function buildPaymentReference(planKey: string, userId?: string | null): string {
  const suffix = userId ? userId.replace(/-/g, "").slice(0, 8).toUpperCase() : "GUEST";
  return `${PAYMENT_CREDENTIALS.bank.referencePrefix}-${planKey.toUpperCase()}-${suffix}`;
}

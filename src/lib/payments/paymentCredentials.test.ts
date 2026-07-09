import { describe, expect, it } from "vitest";
import { buildPaymentReference, maskIban, maskPhone } from "./paymentCredentials";

describe("paymentCredentials", () => {
  it("masks IBAN for public display", () => {
    const masked = maskIban("PK08 MEZN 0099 1701 1274 9131");
    expect(masked).toContain("PK08");
    expect(masked).toContain("9131");
    expect(masked).toContain("••••");
  });

  it("masks phone numbers", () => {
    expect(maskPhone("03211798561")).toContain("•••");
  });

  it("builds unique payment references", () => {
    const ref = buildPaymentReference("pro", "abc-123-def");
    expect(ref).toContain("PRO");
    expect(ref).toContain("ABC123DE");
  });
});

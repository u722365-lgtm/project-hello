import { describe, expect, it } from "vitest";
import { buildCheckoutWhatsAppMessage, buildCheckoutWhatsAppUrl } from "./whatsappCheckout";

describe("whatsappCheckout", () => {
  it("builds a short pre-filled local message", () => {
    const message = buildCheckoutWhatsAppMessage({ planKey: "pro", currency: "USD" });
    expect(message).toBe(
      "Hi Zain, I just transferred $5 for the Pro Plan. Here is my receipt screenshot.",
    );
  });

  it("uses PKR amounts for local wallets", () => {
    const message = buildCheckoutWhatsAppMessage({ planKey: "pro", currency: "PKR" });
    expect(message).toContain("Rs 1,499");
    expect(message).toContain("Pro Plan");
  });

  it("encodes message into wa.me link", () => {
    const url = buildCheckoutWhatsAppUrl({ planKey: "pro", currency: "USD" });
    expect(url).toMatch(/^https:\/\/wa\.me\/923211798561\?text=/);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("Hi Zain");
  });
});

import { describe, expect, it } from "vitest";
import { paymentStatusLabel, paymentStatusTone } from "./fetchUserPayments";

describe("fetchUserPayments helpers", () => {
  it("labels pending and verified statuses", () => {
    expect(paymentStatusLabel("pending")).toBe("Pending verification");
    expect(paymentStatusLabel("verified")).toBe("Activated");
  });

  it("maps status to UI tone", () => {
    expect(paymentStatusTone("verified")).toBe("success");
    expect(paymentStatusTone("pending")).toBe("pending");
    expect(paymentStatusTone("rejected")).toBe("warning");
  });
});

import { describe, expect, it } from "vitest";
import { generateInvoiceNumber } from "./invoice-number-generator";

describe("generateInvoiceNumber", () => {
  it("returns YYYY-001 when no prior invoices exist", () => {
    expect(generateInvoiceNumber(2025, null)).toBe("2025-001");
  });

  it("increments the sequence by 1", () => {
    expect(generateInvoiceNumber(2025, 5)).toBe("2025-006");
  });

  it("zero-pads the sequence to three digits", () => {
    expect(generateInvoiceNumber(2025, 8)).toBe("2025-009");
    expect(generateInvoiceNumber(2025, 99)).toBe("2025-100");
  });

  it("resets to 001 for a new year when lastSequence is null", () => {
    expect(generateInvoiceNumber(2026, null)).toBe("2026-001");
  });

  it("uses the correct year in the prefix", () => {
    expect(generateInvoiceNumber(2030, 0)).toBe("2030-001");
  });
});

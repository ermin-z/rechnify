import { describe, expect, it } from "vitest";
import { calculateVat } from "./vat-calculator";

describe("calculateVat", () => {
  it("returns all zeros for empty input", () => {
    expect(calculateVat([])).toEqual({
      subtotal_excl_vat: 0,
      vat_by_rate: [],
      total_incl_vat: 0,
    });
  });

  it("calculates a single 8.1% line item correctly", () => {
    const result = calculateVat([
      { quantity: 8, unit_price: 150, vat_rate: 0.081 },
    ]);
    expect(result.subtotal_excl_vat).toBe(1200);
    expect(result.vat_by_rate).toEqual([{ rate: 0.081, amount: 97.2 }]);
    expect(result.total_incl_vat).toBe(1297.2);
  });

  it("groups mixed 8.1% and 0% correctly, omitting the zero-rate entry", () => {
    const result = calculateVat([
      { quantity: 1, unit_price: 1000, vat_rate: 0.081 },
      { quantity: 1, unit_price: 500, vat_rate: 0 },
    ]);
    expect(result.subtotal_excl_vat).toBe(1500);
    expect(result.vat_by_rate).toEqual([{ rate: 0.081, amount: 81 }]);
    expect(result.total_incl_vat).toBe(1581);
  });

  it("zero-VAT line item contributes to subtotal but not to vat_by_rate", () => {
    const result = calculateVat([
      { quantity: 1, unit_price: 500, vat_rate: 0 },
    ]);
    expect(result.subtotal_excl_vat).toBe(500);
    expect(result.vat_by_rate).toEqual([]);
    expect(result.total_incl_vat).toBe(500);
  });

  it("groups multiple line items at the same VAT rate", () => {
    const result = calculateVat([
      { quantity: 2, unit_price: 100, vat_rate: 0.081 },
      { quantity: 3, unit_price: 100, vat_rate: 0.081 },
    ]);
    expect(result.subtotal_excl_vat).toBe(500);
    expect(result.vat_by_rate).toEqual([{ rate: 0.081, amount: 40.5 }]);
    expect(result.total_incl_vat).toBe(540.5);
  });

  it("handles multiple distinct VAT rates and sorts descending by rate", () => {
    const result = calculateVat([
      { quantity: 1, unit_price: 100, vat_rate: 0.026 },
      { quantity: 1, unit_price: 100, vat_rate: 0.081 },
      { quantity: 1, unit_price: 100, vat_rate: 0.038 },
    ]);
    expect(result.subtotal_excl_vat).toBe(300);
    expect(result.vat_by_rate[0].rate).toBe(0.081);
    expect(result.vat_by_rate[1].rate).toBe(0.038);
    expect(result.vat_by_rate[2].rate).toBe(0.026);
    expect(result.total_incl_vat).toBe(314.5);
  });

  it("rounds sub-centime intermediates correctly", () => {
    // 1/3 CHF * 0.081 = 0.027 -> rounds to 0.03
    const result = calculateVat([
      { quantity: 1, unit_price: 1 / 3, vat_rate: 0.081 },
    ]);
    expect(result.vat_by_rate[0].amount).toBe(0.03);
  });
});

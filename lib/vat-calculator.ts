export interface LineItem {
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

export interface VatBreakdown {
  rate: number;
  amount: number;
}

export interface VatResult {
  subtotal_excl_vat: number;
  vat_by_rate: VatBreakdown[];
  total_incl_vat: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateVat(items: LineItem[]): VatResult {
  if (items.length === 0) {
    return { subtotal_excl_vat: 0, vat_by_rate: [], total_incl_vat: 0 };
  }

  const vatMap = new Map<number, number>();
  let subtotal = 0;

  for (const item of items) {
    const lineTotal = item.quantity * item.unit_price;
    subtotal += lineTotal;

    if (item.vat_rate > 0) {
      vatMap.set(
        item.vat_rate,
        (vatMap.get(item.vat_rate) ?? 0) + lineTotal * item.vat_rate
      );
    }
  }

  const vat_by_rate: VatBreakdown[] = Array.from(vatMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([rate, amount]) => ({ rate, amount: round2(amount) }));

  const subtotal_excl_vat = round2(subtotal);
  const totalVat = vat_by_rate.reduce((sum, { amount }) => sum + amount, 0);
  const total_incl_vat = round2(subtotal_excl_vat + totalVat);

  return { subtotal_excl_vat, vat_by_rate, total_incl_vat };
}

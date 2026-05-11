import { formatChf } from "@/lib/format";

interface LineItem {
  position: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  vat_rate: string;
}

interface VatRow {
  rate: number;
  amount: number;
}

interface Props {
  items: LineItem[];
  subtotalExclVat: number;
  vatByRate: VatRow[];
  totalInclVat: number;
}

export function LineItemsTable({
  items,
  subtotalExclVat,
  vatByRate,
  totalInclVat,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-[40%]">
                Beschreibung
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Menge
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Einheit
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Preis
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                MwSt.
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Betrag
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => {
              const lineTotal =
                parseFloat(item.quantity) * parseFloat(item.unit_price);
              const rate = parseFloat(item.vat_rate);
              return (
                <tr key={item.position}>
                  <td className="px-4 py-3 text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    CHF {formatChf(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {(rate * 100).toFixed(1)} %
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    CHF {formatChf(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VAT summary */}
      <div className="border-t border-gray-100 px-4 py-4 flex justify-end">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal exkl. MwSt.</span>
            <span className="tabular-nums">CHF {formatChf(subtotalExclVat)}</span>
          </div>
          {vatByRate.map(({ rate, amount }) => (
            <div key={rate} className="flex justify-between text-gray-600">
              <span>MwSt. {(rate * 100).toFixed(1)} %</span>
              <span className="tabular-nums">CHF {formatChf(amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total inkl. MwSt.</span>
            <span className="tabular-nums">CHF {formatChf(totalInclVat)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

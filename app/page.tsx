export const dynamic = "force-dynamic";

import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, invoiceLineItems } from "@/lib/db/schema";
import { formatChf } from "@/lib/format";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_START = `${CURRENT_YEAR}-01-01`;
const NEXT_YEAR_START = `${CURRENT_YEAR + 1}-01-01`;
const VAT_RATES = ["0.081", "0.038", "0.026"] as const;

export default async function DashboardPage() {
  const rows = await db
    .select({
      status: invoices.status,
      issue_date: invoices.issue_date,
      quantity: invoiceLineItems.quantity,
      unit_price: invoiceLineItems.unit_price,
      vat_rate: invoiceLineItems.vat_rate,
    })
    .from(invoices)
    .innerJoin(invoiceLineItems, eq(invoiceLineItems.invoice_id, invoices.id))
    .where(
      and(
        ne(invoices.status, "entwurf"),
        gte(invoices.issue_date, YEAR_START),
        lt(invoices.issue_date, NEXT_YEAR_START)
      )
    );

  let totalInvoiced = 0;
  let totalOutstanding = 0;
  let totalPaid = 0;
  const quarterlyVat: Record<number, Record<string, number>> = {
    1: {},
    2: {},
    3: {},
    4: {},
  };

  for (const row of rows) {
    const lineTotal = parseFloat(row.quantity) * parseFloat(row.unit_price);
    const rate = parseFloat(row.vat_rate);
    const vatAmount = lineTotal * rate;

    totalInvoiced += lineTotal;
    if (row.status === "versendet") totalOutstanding += lineTotal;
    if (row.status === "bezahlt") totalPaid += lineTotal;

    const month = parseInt(row.issue_date.split("-")[1]);
    const quarter = Math.ceil(month / 3);
    const rateKey = rate.toFixed(3);
    quarterlyVat[quarter][rateKey] =
      (quarterlyVat[quarter][rateKey] ?? 0) + vatAmount;
  }

  const quarters = [1, 2, 3, 4] as const;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Fakturiert {CURRENT_YEAR}
          </p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            CHF {formatChf(totalInvoiced)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Ausstehend
          </p>
          <p className="text-2xl font-bold text-blue-600 tabular-nums">
            CHF {formatChf(totalOutstanding)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Bezahlt
          </p>
          <p className="text-2xl font-bold text-green-600 tabular-nums">
            CHF {formatChf(totalPaid)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            MWST-Übersicht {CURRENT_YEAR}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Quartal
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  8.1 %
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  3.8 %
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  2.6 %
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quarters.map((q) => {
                const qVat = quarterlyVat[q];
                const vat81 = qVat["0.081"] ?? 0;
                const vat38 = qVat["0.038"] ?? 0;
                const vat26 = qVat["0.026"] ?? 0;
                const total = vat81 + vat38 + vat26;
                return (
                  <tr key={q}>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      Q{q}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {vat81 > 0 ? `CHF ${formatChf(vat81)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {vat38 > 0 ? `CHF ${formatChf(vat38)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {vat26 > 0 ? `CHF ${formatChf(vat26)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                      {total > 0 ? `CHF ${formatChf(total)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  Jahrestotal
                </td>
                {VAT_RATES.map((rate) => {
                  const yearTotal = quarters.reduce(
                    (sum, q) => sum + (quarterlyVat[q][rate] ?? 0),
                    0
                  );
                  return (
                    <td
                      key={rate}
                      className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900"
                    >
                      {yearTotal > 0 ? `CHF ${formatChf(yearTotal)}` : "—"}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                  CHF{" "}
                  {formatChf(
                    quarters.reduce(
                      (sum, q) =>
                        sum +
                        VAT_RATES.reduce(
                          (s, r) => s + (quarterlyVat[q][r] ?? 0),
                          0
                        ),
                      0
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

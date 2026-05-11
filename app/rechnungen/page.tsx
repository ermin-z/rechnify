export const dynamic = "force-dynamic";

import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, invoiceLineItems, invoices } from "@/lib/db/schema";
import { formatChf, formatDate } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  bezahlt: "Bezahlt",
};

const STATUS_STYLES: Record<string, string> = {
  entwurf: "bg-gray-100 text-gray-700",
  versendet: "bg-blue-100 text-blue-700",
  bezahlt: "bg-green-100 text-green-700",
};

const VALID_STATUSES = ["entwurf", "versendet", "bezahlt"] as const;
type InvoiceStatus = (typeof VALID_STATUSES)[number];

const TABS = [
  { label: "Alle", value: undefined },
  { label: "Entwurf", value: "entwurf" },
  { label: "Versendet", value: "versendet" },
  { label: "Bezahlt", value: "bezahlt" },
] as const;

export default async function RechnungenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus =
    status && (VALID_STATUSES as readonly string[]).includes(status)
      ? (status as InvoiceStatus)
      : undefined;

  const rows = await db
    .select({
      id: invoices.id,
      invoice_number: invoices.invoice_number,
      status: invoices.status,
      issue_date: invoices.issue_date,
      due_date: invoices.due_date,
      client_name: clients.company_name,
      total:
        sql<string>`COALESCE(SUM(CAST(${invoiceLineItems.quantity} AS numeric) * CAST(${invoiceLineItems.unit_price} AS numeric) * (1 + CAST(${invoiceLineItems.vat_rate} AS numeric))), 0)`,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.client_id, clients.id))
    .leftJoin(invoiceLineItems, eq(invoiceLineItems.invoice_id, invoices.id))
    .where(activeStatus ? eq(invoices.status, activeStatus) : undefined)
    .groupBy(invoices.id, clients.company_name)
    .orderBy(desc(invoices.issue_date));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
        <Link
          href="/rechnungen/neu"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Neue Rechnung
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TABS.map((tab) => {
          const href =
            tab.value ? `/rechnungen?status=${tab.value}` : "/rechnungen";
          const active = activeStatus === tab.value;
          return (
            <Link
              key={tab.label}
              href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-sm">Keine Rechnungen vorhanden.</p>
          {!activeStatus && (
            <Link
              href="/rechnungen/neu"
              className="mt-3 inline-block text-sm font-medium text-gray-900 underline underline-offset-2"
            >
              Erste Rechnung erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Nr.
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Kunde
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Datum
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Fällig
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Total
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/rechnungen/${row.id}`}
                      className="font-mono font-medium text-gray-900 hover:underline"
                    >
                      {row.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.client_name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(row.issue_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(row.due_date)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    CHF {formatChf(row.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                    >
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

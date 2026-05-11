export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, invoiceLineItems, invoices } from "@/lib/db/schema";
import { calculateVat } from "@/lib/vat-calculator";
import { formatDate } from "@/lib/format";
import { LineItemsTable } from "./_components/line-items-table";
import { StatusActions } from "./_components/status-actions";
import { duplicateInvoice } from "../actions";

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

export default async function RechnungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({
      invoice: invoices,
      client: clients,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.client_id, clients.id))
    .where(eq(invoices.id, id));

  if (!row) notFound();

  const { invoice, client } = row;

  const items = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoice_id, id))
    .orderBy(asc(invoiceLineItems.position));

  const vat = calculateVat(
    items.map((i) => ({
      quantity: parseFloat(i.quantity),
      unit_price: parseFloat(i.unit_price),
      vat_rate: parseFloat(i.vat_rate),
    }))
  );

  const duplicateAction = duplicateInvoice.bind(null, id);

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/rechnungen" className="hover:text-gray-900 transition-colors">
          Rechnungen
        </Link>
        <span>/</span>
        <span className="font-mono text-gray-900">{invoice.invoice_number}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            {invoice.invoice_number}
          </h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[invoice.status]}`}
          >
            {STATUS_LABELS[invoice.status]}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {invoice.status === "entwurf" && (
            <Link
              href={`/rechnungen/${id}/bearbeiten`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Bearbeiten
            </Link>
          )}
          <form action={duplicateAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Duplizieren
            </button>
          </form>
          <StatusActions id={id} status={invoice.status} />
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Kunde
          </p>
          <p className="font-semibold text-gray-900">{client.company_name}</p>
          {client.contact_person && (
            <p className="text-sm text-gray-600">{client.contact_person}</p>
          )}
          <p className="text-sm text-gray-600">{client.street}</p>
          <p className="text-sm text-gray-600">
            {client.zip} {client.city}
          </p>
          {client.uid && (
            <p className="text-sm text-gray-500 mt-1">{client.uid}</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Rechnungsdatum
            </p>
            <p className="text-sm text-gray-900 mt-0.5">
              {formatDate(invoice.issue_date)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fällig am
            </p>
            <p className="text-sm text-gray-900 mt-0.5">
              {formatDate(invoice.due_date)}
            </p>
          </div>
          {invoice.paid_at && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Bezahlt am
              </p>
              <p className="text-sm text-green-700 font-medium mt-0.5">
                {formatDate(invoice.paid_at)}
              </p>
            </div>
          )}
          {invoice.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Notizen
              </p>
              <p className="text-sm text-gray-700 mt-0.5">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <LineItemsTable
        items={items}
        subtotalExclVat={vat.subtotal_excl_vat}
        vatByRate={vat.vat_by_rate}
        totalInclVat={vat.total_incl_vat}
      />
    </div>
  );
}

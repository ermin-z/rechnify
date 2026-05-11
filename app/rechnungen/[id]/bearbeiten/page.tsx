export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, invoiceLineItems, invoices } from "@/lib/db/schema";
import { updateInvoice } from "../../actions";
import { InvoiceForm } from "../../_components/invoice-form";

export default async function BearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({ invoice: invoices })
    .from(invoices)
    .where(eq(invoices.id, id));

  if (!row) notFound();
  if (row.invoice.status !== "entwurf") redirect(`/rechnungen/${id}`);

  const items = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoice_id, id))
    .orderBy(asc(invoiceLineItems.position));

  const allClients = await db
    .select({
      id: clients.id,
      company_name: clients.company_name,
      payment_term_days: clients.payment_term_days,
    })
    .from(clients);

  const action = updateInvoice.bind(null, id);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/rechnungen" className="hover:text-gray-900 transition-colors">
          Rechnungen
        </Link>
        <span>/</span>
        <Link
          href={`/rechnungen/${id}`}
          className="font-mono hover:text-gray-900 transition-colors"
        >
          {row.invoice.invoice_number}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Bearbeiten</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Rechnung bearbeiten
      </h1>

      <InvoiceForm
        clients={allClients}
        action={action}
        submitLabel="Änderungen speichern"
        initialData={{
          clientId: row.invoice.client_id,
          issueDate: row.invoice.issue_date,
          dueDate: row.invoice.due_date,
          notes: row.invoice.notes,
          lineItems: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unit_price: i.unit_price,
            vat_rate: i.vat_rate,
          })),
        }}
      />
    </div>
  );
}

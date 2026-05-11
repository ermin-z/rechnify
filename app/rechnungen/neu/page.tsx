export const dynamic = "force-dynamic";

import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { createInvoice } from "../actions";
import { InvoiceForm } from "../_components/invoice-form";

export default async function NeueRechnungPage() {
  const allClients = await db
    .select({
      id: clients.id,
      company_name: clients.company_name,
      payment_term_days: clients.payment_term_days,
    })
    .from(clients)
    .orderBy(asc(clients.company_name));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link
          href="/rechnungen"
          className="hover:text-gray-900 transition-colors"
        >
          Rechnungen
        </Link>
        <span>/</span>
        <span className="text-gray-900">Neue Rechnung</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Neue Rechnung</h1>

      <InvoiceForm clients={allClients} action={createInvoice} />
    </div>
  );
}

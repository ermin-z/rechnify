export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export default async function KundenPage() {
  const all = await db
    .select()
    .from(clients)
    .orderBy(asc(clients.company_name));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
        <Link
          href="/kunden/neu"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Neuer Kunde
        </Link>
      </div>

      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-sm">Noch keine Kunden erfasst.</p>
          <Link
            href="/kunden/neu"
            className="mt-3 inline-block text-sm font-medium text-gray-900 underline underline-offset-2"
          >
            Ersten Kunden anlegen
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Firma
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Ort
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  E-Mail
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Zahlungsziel
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {all.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/kunden/${client.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {client.company_name}
                    </Link>
                    {client.contact_person && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        {client.contact_person}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.zip} {client.city}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{client.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.payment_term_days} Tage
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

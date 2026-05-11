export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { updateClient } from "../actions";
import { ClientForm } from "../_components/client-form";
import { DeleteClientButton } from "../_components/delete-button";

export default async function KundeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id));

  if (!client) notFound();

  const updateWithId = updateClient.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/kunden" className="hover:text-gray-900 transition-colors">
          Kunden
        </Link>
        <span>/</span>
        <span className="text-gray-900">{client.company_name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {client.company_name}
        </h1>
        <DeleteClientButton id={id} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ClientForm
          action={updateWithId}
          client={client}
          submitLabel="Änderungen speichern"
        />
      </div>
    </div>
  );
}

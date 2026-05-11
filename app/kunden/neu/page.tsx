import Link from "next/link";
import { createClient } from "../actions";
import { ClientForm } from "../_components/client-form";

export default function NeuerKundePage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/kunden" className="hover:text-gray-900 transition-colors">
          Kunden
        </Link>
        <span>/</span>
        <span className="text-gray-900">Neuer Kunde</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Neuer Kunde</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ClientForm action={createClient} submitLabel="Kunde anlegen" />
      </div>
    </div>
  );
}

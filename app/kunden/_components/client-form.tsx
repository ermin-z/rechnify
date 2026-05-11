"use client";

import { useRef } from "react";
import type { clients } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Client = InferSelectModel<typeof clients>;

interface ClientFormProps {
  action: (formData: FormData) => Promise<void>;
  client?: Client;
  submitLabel: string;
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {!required && (
          <span className="ml-1 text-gray-400 font-normal">(optional)</span>
        )}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  );
}

export function ClientForm({ action, client, submitLabel }: ClientFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field
            label="Firma"
            name="company_name"
            required
            defaultValue={client?.company_name}
          />
        </div>
        <div className="col-span-2">
          <Field
            label="Ansprechperson"
            name="contact_person"
            defaultValue={client?.contact_person}
          />
        </div>
        <div className="col-span-2">
          <Field
            label="Strasse"
            name="street"
            required
            defaultValue={client?.street}
          />
        </div>
        <Field
          label="PLZ"
          name="zip"
          required
          defaultValue={client?.zip}
          placeholder="8001"
        />
        <Field
          label="Ort"
          name="city"
          required
          defaultValue={client?.city}
          placeholder="Zürich"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Land
          </label>
          <select
            name="country"
            defaultValue={client?.country ?? "CH"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="CH">Schweiz</option>
            <option value="DE">Deutschland</option>
            <option value="AT">Österreich</option>
            <option value="LI">Liechtenstein</option>
          </select>
        </div>
        <Field
          label="E-Mail"
          name="email"
          type="email"
          required
          defaultValue={client?.email}
        />
        <div className="col-span-2">
          <Field
            label="UID"
            name="uid"
            defaultValue={client?.uid}
            placeholder="CHE-123.456.789 MWST"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zahlungsziel (Tage)
          </label>
          <input
            name="payment_term_days"
            type="number"
            min="1"
            max="365"
            required
            defaultValue={client?.payment_term_days ?? 30}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notizen{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={client?.notes ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
        >
          {submitLabel}
        </button>
        <a
          href="/kunden"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </a>
      </div>
    </form>
  );
}

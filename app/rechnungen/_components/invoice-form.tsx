"use client";

import Link from "next/link";
import { useState } from "react";
import { calculateVat } from "@/lib/vat-calculator";
import { formatChf } from "@/lib/format";

interface ClientOption {
  id: string;
  company_name: string;
  payment_term_days: number;
}

interface LineItem {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  vat_rate: string;
}

const VAT_RATES = [
  { label: "8.1 %", value: "0.081" },
  { label: "3.8 %", value: "0.038" },
  { label: "2.6 %", value: "0.026" },
  { label: "0 %", value: "0" },
];

function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function emptyItem(): LineItem {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unit: "h",
    unit_price: "",
    vat_rate: "0.081",
  };
}

interface InitialData {
  clientId: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  lineItems: Array<{
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    vat_rate: string;
  }>;
}

interface Props {
  clients: ClientOption[];
  action: (formData: FormData) => Promise<void>;
  initialData?: InitialData;
  submitLabel?: string;
}

export function InvoiceForm({
  clients,
  action,
  initialData,
  submitLabel = "Als Entwurf speichern",
}: Props) {
  const firstClient = clients[0];
  const today = isoToday();

  const [clientId, setClientId] = useState(
    initialData?.clientId ?? firstClient?.id ?? ""
  );
  const [issueDate, setIssueDate] = useState(initialData?.issueDate ?? today);
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ??
      (firstClient ? addDays(today, firstClient.payment_term_days) : today)
  );
  const [items, setItems] = useState<LineItem[]>(
    initialData?.lineItems.map((i) => ({ ...i, key: crypto.randomUUID() })) ?? [
      emptyItem(),
    ]
  );

  const selectedClient = clients.find((c) => c.id === clientId);

  function onClientChange(id: string) {
    setClientId(id);
    const c = clients.find((c) => c.id === id);
    if (c) setDueDate(addDays(issueDate, c.payment_term_days));
  }

  function onIssueDateChange(date: string) {
    setIssueDate(date);
    if (selectedClient) setDueDate(addDays(date, selectedClient.payment_term_days));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function updateItem(key: string, field: keyof Omit<LineItem, "key">, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i))
    );
  }

  const parsedItems = items.map((i) => ({
    quantity: parseFloat(i.quantity) || 0,
    unit_price: parseFloat(i.unit_price) || 0,
    vat_rate: parseFloat(i.vat_rate) || 0,
  }));

  const vat = calculateVat(parsedItems);

  const lineItemsJson = JSON.stringify(
    items.map((i) => ({
      description: i.description,
      quantity: parseFloat(i.quantity) || 0,
      unit: i.unit,
      unit_price: parseFloat(i.unit_price) || 0,
      vat_rate: parseFloat(i.vat_rate) || 0,
    }))
  );

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500 text-sm">
          Zuerst einen Kunden anlegen, bevor eine Rechnung erstellt werden kann.
        </p>
        <Link
          href="/kunden/neu"
          className="mt-3 inline-block text-sm font-medium text-gray-900 underline underline-offset-2"
        >
          Kunden anlegen
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="line_items" value={lineItemsJson} />

      {/* Header fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kunde
          </label>
          <select
            name="client_id"
            value={clientId}
            onChange={(e) => onClientChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rechnungsdatum
          </label>
          <input
            name="issue_date"
            type="date"
            value={issueDate}
            onChange={(e) => onIssueDateChange(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fällig am
          </label>
          <input
            name="due_date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
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
            rows={2}
            defaultValue={initialData?.notes ?? ""}
            placeholder="Projektreferenz, Zahlungshinweise…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Positionen</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-[35%]">
                  Beschreibung
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-20">
                  Menge
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">
                  Einheit
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">
                  Preis (CHF)
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-24">
                  MwSt.
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">
                  Betrag
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const lineTotal =
                  (parseFloat(item.quantity) || 0) *
                  (parseFloat(item.unit_price) || 0);
                return (
                  <tr key={item.key}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.key, "description", e.target.value)
                        }
                        placeholder="Leistungsbeschreibung"
                        required
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.key, "quantity", e.target.value)
                        }
                        min="0"
                        step="0.5"
                        required
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(item.key, "unit", e.target.value)
                        }
                        placeholder="h"
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(item.key, "unit_price", e.target.value)
                        }
                        min="0"
                        step="0.05"
                        placeholder="0.00"
                        required
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={item.vat_rate}
                        onChange={(e) =>
                          updateItem(item.key, "vat_rate", e.target.value)
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      >
                        {VAT_RATES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700 tabular-nums">
                      {formatChf(lineTotal)}
                    </td>
                    <td className="px-2 py-2">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="text-gray-400 hover:text-red-500 transition-colors px-1"
                          aria-label="Position entfernen"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100">
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            + Position hinzufügen
          </button>
        </div>
      </div>

      {/* VAT summary */}
      <div className="flex justify-end">
        <div className="w-72 bg-white rounded-xl border border-gray-200 p-5 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal exkl. MwSt.</span>
            <span className="tabular-nums">CHF {formatChf(vat.subtotal_excl_vat)}</span>
          </div>
          {vat.vat_by_rate.map(({ rate, amount }) => (
            <div key={rate} className="flex justify-between text-gray-600">
              <span>MwSt. {(rate * 100).toFixed(1)} %</span>
              <span className="tabular-nums">CHF {formatChf(amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total inkl. MwSt.</span>
            <span className="tabular-nums">CHF {formatChf(vat.total_incl_vat)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
        >
          {submitLabel}
        </button>
        <Link
          href="/rechnungen"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { calculateVat } from "@/lib/vat-calculator";
import { formatChf } from "@/lib/format";

// PROTOTYPE: Three whole-product Rechnify variants, switchable via
// ?variant=, using static data and no persistence.

type InvoiceStatus = "entwurf" | "versendet" | "bezahlt";

interface PrototypeClient {
  id: string;
  companyName: string;
  contactPerson: string;
  city: string;
  email: string;
  paymentTermDays: number;
  revenueTarget: number;
}

interface PrototypeLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

interface PrototypeInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  notes: string;
  lineItems: PrototypeLineItem[];
}

interface PrototypeData {
  year: number;
  clients: PrototypeClient[];
  invoices: PrototypeInvoice[];
}

const VARIANTS = [
  { key: "A", label: "Compact cockpit" },
  { key: "B", label: "Document workspace" },
  { key: "C", label: "Pipeline board" },
] as const;

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  bezahlt: "Bezahlt",
};

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  entwurf: "bg-gray-100 text-gray-700 ring-gray-200",
  versendet: "bg-sky-100 text-sky-800 ring-sky-200",
  bezahlt: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const DATA: PrototypeData = {
  year: 2026,
  clients: [
    {
      id: "client-1",
      companyName: "Alpine Studio AG",
      contactPerson: "Mara Keller",
      city: "Zurich",
      email: "mara@alpine.example",
      paymentTermDays: 30,
      revenueTarget: 42000,
    },
    {
      id: "client-2",
      companyName: "Nordlicht Consulting",
      contactPerson: "Timo Frei",
      city: "Basel",
      email: "timo@nordlicht.example",
      paymentTermDays: 14,
      revenueTarget: 28000,
    },
    {
      id: "client-3",
      companyName: "Glanzwerk GmbH",
      contactPerson: "Lea Brand",
      city: "Bern",
      email: "lea@glanzwerk.example",
      paymentTermDays: 10,
      revenueTarget: 18000,
    },
  ],
  invoices: [
    {
      id: "invoice-1",
      invoiceNumber: "RE-2026-0008",
      clientId: "client-1",
      status: "entwurf",
      issueDate: "2026-05-11",
      dueDate: "2026-06-10",
      paidAt: null,
      notes: "Retainer Mai",
      lineItems: [
        {
          description: "Beratung Produktstrategie",
          quantity: 6,
          unit: "h",
          unitPrice: 180,
          vatRate: 0.081,
        },
        {
          description: "Spesen Bahn",
          quantity: 1,
          unit: "Stk",
          unitPrice: 64.5,
          vatRate: 0,
        },
      ],
    },
    {
      id: "invoice-2",
      invoiceNumber: "RE-2026-0007",
      clientId: "client-2",
      status: "versendet",
      issueDate: "2026-04-22",
      dueDate: "2026-05-06",
      paidAt: null,
      notes: "Migration April",
      lineItems: [
        {
          description: "Umsetzung Automatisierung",
          quantity: 1,
          unit: "Pauschal",
          unitPrice: 2400,
          vatRate: 0.081,
        },
      ],
    },
    {
      id: "invoice-3",
      invoiceNumber: "RE-2026-0006",
      clientId: "client-1",
      status: "bezahlt",
      issueDate: "2026-03-12",
      dueDate: "2026-04-11",
      paidAt: "2026-03-30",
      notes: "Workshop",
      lineItems: [
        {
          description: "Workshop Vorbereitung",
          quantity: 4,
          unit: "h",
          unitPrice: 180,
          vatRate: 0.081,
        },
        {
          description: "Hosting Weiterverrechnung",
          quantity: 3,
          unit: "Monat",
          unitPrice: 39,
          vatRate: 0.038,
        },
      ],
    },
    {
      id: "invoice-4",
      invoiceNumber: "RE-2026-0005",
      clientId: "client-3",
      status: "versendet",
      issueDate: "2026-02-18",
      dueDate: "2026-02-28",
      paidAt: null,
      notes: "Design Sprint",
      lineItems: [
        {
          description: "Sprint Moderation",
          quantity: 2,
          unit: "Tag",
          unitPrice: 1350,
          vatRate: 0.081,
        },
      ],
    },
  ],
};

export default async function RechnifyPrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { variant } = await searchParams;
  const activeVariant = VARIANTS.some((item) => item.key === variant)
    ? (variant as "A" | "B" | "C")
    : "A";
  const model = buildModel(DATA);

  return (
    <div className="pb-24">
      {activeVariant === "A" && <VariantA model={model} />}
      {activeVariant === "B" && <VariantB model={model} />}
      {activeVariant === "C" && <VariantC model={model} />}

      <PrototypeState variant={activeVariant} model={model} />
      <PrototypeSwitcher variants={[...VARIANTS]} current={activeVariant} />
    </div>
  );
}

function VariantA({ model }: { model: PrototypeModel }) {
  return (
    <main className="max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
            Rechnify Prototyp A
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">
            Betriebsbild
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton>Neue Rechnung</ActionButton>
          <SecondaryButton>Neuer Kunde</SecondaryButton>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={`Fakturiert ${model.year}`}
          value={`CHF ${formatChf(model.totalInvoiced)}`}
          tone="ink"
        />
        <Metric
          label="Ausstehend"
          value={`CHF ${formatChf(model.totalOutstanding)}`}
          tone="sky"
        />
        <Metric
          label="Bezahlt"
          value={`CHF ${formatChf(model.totalPaid)}`}
          tone="emerald"
        />
        <Metric
          label="Naechste Faelligkeit"
          value={model.nextDue?.invoiceNumber ?? "Keine"}
          caption={model.nextDue ? `${model.nextDue.dueDate}` : undefined}
          tone="amber"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Rechnungsqueue
            </h2>
            <span className="text-xs font-medium text-gray-500">
              {model.invoices.length} Eintraege
            </span>
          </div>
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Nr.</th>
                  <th className="px-4 py-3">Kunde</th>
                  <th className="px-4 py-3">Faellig</th>
                  <th className="px-4 py-3 text-right">Netto</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {model.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-950">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {invoice.client.companyName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {invoice.dueDate}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                      CHF {formatChf(invoice.totals.subtotal)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              MWST nach Quartal
            </h2>
            <div className="mt-4 space-y-3">
              {Object.entries(model.vatByQuarter).map(([quarter, value]) => (
                <div
                  key={quarter}
                  className="grid grid-cols-[3rem_1fr] items-center gap-3"
                >
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {quarter}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-cyan-600"
                      style={{
                        width: `${Math.min(100, (value / model.maxQuarterVat) * 100)}%`,
                      }}
                    />
                  </div>
                  <span />
                  <span className="text-xs tabular-nums text-gray-500">
                    CHF {formatChf(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Kundenfokus
            </h2>
            <div className="mt-3 space-y-2">
              {model.clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 first:border-t-0 first:pt-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {client.companyName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {client.invoiceCount} Rechnungen, {client.paymentTermDays} Tage
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-gray-950">
                    {Math.round(client.revenueProgress)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function VariantB({ model }: { model: PrototypeModel }) {
  const draft = model.invoices.find((invoice) => invoice.status === "entwurf")!;

  return (
    <main className="max-w-7xl">
      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Rechnify Prototyp B
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">
            Rechnungsarbeitsplatz
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton>Entwurf duplizieren</SecondaryButton>
          <ActionButton>Als versendet markieren</ActionButton>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-h-[720px] rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 border-b border-gray-200 pb-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">
                {draft.invoiceNumber}
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-gray-950">
                Rechnung
              </h2>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm font-semibold text-gray-950">
                {draft.client.companyName}
              </p>
              <p className="text-sm text-gray-600">{draft.client.contactPerson}</p>
              <p className="text-sm text-gray-600">{draft.client.city}</p>
              <p className="mt-2 text-sm text-gray-500">
                Faellig {draft.dueDate}
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4">Leistung</th>
                  <th className="px-4 py-3 text-right">Menge</th>
                  <th className="px-4 py-3 text-right">Preis</th>
                  <th className="py-3 pl-4 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {draft.lineItems.map((item) => (
                  <tr key={item.description}>
                    <td className="py-4 pr-4 font-medium text-gray-950">
                      {item.description}
                      <p className="mt-1 text-xs font-normal text-gray-500">
                        MWST {(item.vatRate * 100).toFixed(1)} %
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-700">
                      CHF {formatChf(item.unitPrice)}
                    </td>
                    <td className="py-4 pl-4 text-right tabular-nums font-semibold text-gray-950">
                      CHF {formatChf(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <TotalsBlock invoice={draft} />
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-950 p-4 text-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Entwurf</h2>
              <StatusBadge status={draft.status} />
            </div>
            <div className="mt-5 space-y-3">
              <FieldPreview label="Kunde" value={draft.client.companyName} />
              <FieldPreview label="Rechnungsdatum" value={draft.issueDate} />
              <FieldPreview label="Faellig am" value={draft.dueDate} />
              <FieldPreview label="Notizen" value={draft.notes} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Statusfluss
            </h2>
            <div className="mt-4 space-y-3">
              {(["entwurf", "versendet", "bezahlt"] as InvoiceStatus[]).map(
                (status, index) => (
                  <div key={status} className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                        index === 0
                          ? "bg-gray-950 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-semibold text-amber-950">
              Auswirkungen
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Dieser Entwurf zaehlt erst nach dem Versand in Umsatz und MWST.
              Die Positionen bleiben bis dahin frei editierbar.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function VariantC({ model }: { model: PrototypeModel }) {
  const grouped = groupByStatus(model.invoices);

  return (
    <main className="max-w-7xl space-y-5">
      <header className="grid gap-4 border-b border-gray-200 pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Rechnify Prototyp C
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">
            Pipeline
          </h1>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-gray-200 bg-white text-center">
          <MiniMetric label="Entwurf" value={model.counts.entwurf} />
          <MiniMetric label="Versendet" value={model.counts.versendet} />
          <MiniMetric label="Bezahlt" value={model.counts.bezahlt} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 lg:grid-cols-3">
          {(["entwurf", "versendet", "bezahlt"] as InvoiceStatus[]).map(
            (status) => (
              <section
                key={status}
                className="min-h-[560px] rounded-lg border border-gray-200 bg-gray-100 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {STATUS_LABELS[status]}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {grouped[status].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {grouped[status].map((invoice) => (
                    <article
                      key={invoice.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-semibold text-gray-950">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {invoice.client.companyName}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-gray-950">
                          CHF {formatChf(invoice.totals.total)}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>Faellig {invoice.dueDate}</span>
                        <span>{invoice.lineItems.length} Positionen</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Zahlungsluecke
            </h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
              CHF {formatChf(model.totalOutstanding)}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Offene versendete Rechnungen, ohne Entwuerfe.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Kundenledger
            </h2>
            <div className="mt-4 space-y-4">
              {model.clients.map((client) => (
                <div key={client.id}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">
                      {client.companyName}
                    </p>
                    <p className="text-sm tabular-nums text-gray-600">
                      CHF {formatChf(client.revenue)}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${Math.min(100, client.revenueProgress)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">MWST</h2>
            <div className="mt-3 divide-y divide-gray-100">
              {Object.entries(model.vatByQuarter).map(([quarter, amount]) => (
                <div
                  key={quarter}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="font-mono font-semibold text-gray-800">
                    {quarter}
                  </span>
                  <span className="tabular-nums text-gray-700">
                    CHF {formatChf(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function PrototypeState({
  variant,
  model,
}: {
  variant: string;
  model: PrototypeModel;
}) {
  const snapshot = {
    variant,
    clients: model.clients.map((client) => ({
      id: client.id,
      companyName: client.companyName,
      invoiceCount: client.invoiceCount,
      revenue: client.revenue,
    })),
    invoiceCounts: model.counts,
    totals: {
      invoiced: model.totalInvoiced,
      outstanding: model.totalOutstanding,
      paid: model.totalPaid,
      vatByQuarter: model.vatByQuarter,
    },
    nextDue: model.nextDue
      ? {
          invoiceNumber: model.nextDue.invoiceNumber,
          dueDate: model.nextDue.dueDate,
          status: model.nextDue.status,
        }
      : null,
  };

  return (
    <section className="mt-8 max-w-7xl rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
      <h2 className="text-sm font-semibold text-gray-900">Prototype state</h2>
      <pre className="mt-3 max-h-80 overflow-auto text-xs leading-5 text-gray-600">
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </section>
  );
}

function Metric({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption?: string;
  tone: "ink" | "sky" | "emerald" | "amber";
}) {
  const tones = {
    ink: "text-gray-950 bg-white",
    sky: "text-sky-950 bg-sky-50",
    emerald: "text-emerald-950 bg-emerald-50",
    amber: "text-amber-950 bg-amber-50",
  };

  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {caption && <p className="mt-1 text-xs text-gray-500">{caption}</p>}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-gray-200 px-5 py-3 last:border-r-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-gray-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
    >
      {children}
    </button>
  );
}

function FieldPreview({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-50">{value}</p>
    </div>
  );
}

function TotalsBlock({ invoice }: { invoice: EnrichedInvoice }) {
  return (
    <div className="w-full max-w-sm space-y-2 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal exkl. MWST</span>
        <span className="tabular-nums">
          CHF {formatChf(invoice.totals.subtotal)}
        </span>
      </div>
      {invoice.totals.vat.map(({ rate, amount }) => (
        <div key={rate} className="flex justify-between text-gray-600">
          <span>MWST {(rate * 100).toFixed(1)} %</span>
          <span className="tabular-nums">CHF {formatChf(amount)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold text-gray-950">
        <span>Total inkl. MWST</span>
        <span className="tabular-nums">CHF {formatChf(invoice.totals.total)}</span>
      </div>
    </div>
  );
}

interface InvoiceTotals {
  subtotal: number;
  vat: Array<{ rate: number; amount: number }>;
  total: number;
}

interface EnrichedInvoice extends PrototypeInvoice {
  client: PrototypeClient;
  totals: InvoiceTotals;
}

interface EnrichedClient extends PrototypeClient {
  invoiceCount: number;
  revenue: number;
  revenueProgress: number;
}

interface PrototypeModel {
  year: number;
  clients: EnrichedClient[];
  invoices: EnrichedInvoice[];
  totalInvoiced: number;
  totalOutstanding: number;
  totalPaid: number;
  counts: Record<InvoiceStatus, number>;
  vatByQuarter: Record<"Q1" | "Q2" | "Q3" | "Q4", number>;
  maxQuarterVat: number;
  nextDue: EnrichedInvoice | null;
}

function buildModel(data: PrototypeData): PrototypeModel {
  const clientMap = new Map(data.clients.map((client) => [client.id, client]));
  const invoices = data.invoices.map((invoice) => ({
    ...invoice,
    client: clientMap.get(invoice.clientId)!,
    totals: totalsFor(invoice),
  }));

  const counts = {
    entwurf: 0,
    versendet: 0,
    bezahlt: 0,
  };
  const vatByQuarter = {
    Q1: 0,
    Q2: 0,
    Q3: 0,
    Q4: 0,
  };

  let totalInvoiced = 0;
  let totalOutstanding = 0;
  let totalPaid = 0;

  for (const invoice of invoices) {
    counts[invoice.status] += 1;
    if (invoice.status !== "entwurf") {
      totalInvoiced += invoice.totals.subtotal;
    }
    if (invoice.status === "versendet") {
      totalOutstanding += invoice.totals.subtotal;
    }
    if (invoice.status === "bezahlt") {
      totalPaid += invoice.totals.subtotal;
    }

    const quarter = `Q${Math.ceil(Number(invoice.issueDate.slice(5, 7)) / 3)}` as
      | "Q1"
      | "Q2"
      | "Q3"
      | "Q4";
    vatByQuarter[quarter] += invoice.totals.vat.reduce(
      (sum, row) => sum + row.amount,
      0
    );
  }

  const clients = data.clients.map((client) => {
    const ownedInvoices = invoices.filter((invoice) => invoice.clientId === client.id);
    const revenue = ownedInvoices
      .filter((invoice) => invoice.status !== "entwurf")
      .reduce((sum, invoice) => sum + invoice.totals.subtotal, 0);
    return {
      ...client,
      invoiceCount: ownedInvoices.length,
      revenue,
      revenueProgress: client.revenueTarget
        ? (revenue / client.revenueTarget) * 100
        : 0,
    };
  });

  const nextDue =
    invoices
      .filter((invoice) => invoice.status === "versendet")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;

  return {
    year: data.year,
    clients,
    invoices,
    totalInvoiced,
    totalOutstanding,
    totalPaid,
    counts,
    vatByQuarter: {
      Q1: round2(vatByQuarter.Q1),
      Q2: round2(vatByQuarter.Q2),
      Q3: round2(vatByQuarter.Q3),
      Q4: round2(vatByQuarter.Q4),
    },
    maxQuarterVat: Math.max(1, ...Object.values(vatByQuarter)),
    nextDue,
  };
}

function totalsFor(invoice: PrototypeInvoice): InvoiceTotals {
  const result = calculateVat(
    invoice.lineItems.map((item) => ({
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_rate: item.vatRate,
    }))
  );

  return {
    subtotal: result.subtotal_excl_vat,
    vat: result.vat_by_rate,
    total: result.total_incl_vat,
  };
}

function groupByStatus(invoices: EnrichedInvoice[]) {
  return invoices.reduce(
    (acc, invoice) => {
      acc[invoice.status].push(invoice);
      return acc;
    },
    {
      entwurf: [] as EnrichedInvoice[],
      versendet: [] as EnrichedInvoice[],
      bezahlt: [] as EnrichedInvoice[],
    }
  );
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

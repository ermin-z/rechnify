// PROTOTYPE: Does one in-memory state model cover Rechnify's core workflow:
// customer setup, draft invoice editing, send, pay, duplicate, delete rules,
// VAT totals, and dashboard aggregates?

export const STATUSES = ["entwurf", "versendet", "bezahlt"];

const LINE_TEMPLATES = [
  {
    description: "Beratung Produktstrategie",
    quantity: 6,
    unit: "h",
    unitPrice: 180,
    vatRate: 0.081,
  },
  {
    description: "Umsetzung Automatisierung",
    quantity: 1,
    unit: "Pauschal",
    unitPrice: 2400,
    vatRate: 0.081,
  },
  {
    description: "Spesen Bahn",
    quantity: 1,
    unit: "Stk",
    unitPrice: 64.5,
    vatRate: 0,
  },
  {
    description: "Hosting Weiterverrechnung",
    quantity: 3,
    unit: "Monat",
    unitPrice: 39,
    vatRate: 0.038,
  },
];

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextId(prefix, state) {
  return `${prefix}-${state.counters[prefix] + 1}`;
}

function nextInvoiceNumber(state) {
  const year = state.today.slice(0, 4);
  const seq = state.counters.invoiceNumber + 1;
  return `RE-${year}-${String(seq).padStart(4, "0")}`;
}

function cloneState(state) {
  return {
    ...state,
    counters: { ...state.counters },
    clients: state.clients.map((client) => ({ ...client })),
    invoices: state.invoices.map((invoice) => ({
      ...invoice,
      lineItems: invoice.lineItems.map((item) => ({ ...item })),
    })),
  };
}

function withEvent(state, lastEvent) {
  return { ...state, lastEvent };
}

function selectedClient(state) {
  return state.clients.find((client) => client.id === state.selectedClientId);
}

function selectedInvoice(state) {
  return state.invoices.find((invoice) => invoice.id === state.selectedInvoiceId);
}

function invoiceClient(state, invoice) {
  return state.clients.find((client) => client.id === invoice.clientId);
}

function replaceInvoice(state, invoice, lastEvent) {
  return withEvent(
    {
      ...state,
      invoices: state.invoices.map((item) =>
        item.id === invoice.id ? invoice : item
      ),
    },
    lastEvent
  );
}

function invoiceFromTemplate(state, client, sourceInvoice = null) {
  const id = nextId("invoice", state);
  const issueDate = state.today;
  const dueDate = addDays(issueDate, client.paymentTermDays);
  const lineItems =
    sourceInvoice?.lineItems.map((item, index) => ({
      ...item,
      id: `line-${id}-${index + 1}`,
    })) ?? [{ ...LINE_TEMPLATES[0], id: `line-${id}-1` }];

  return {
    id,
    invoiceNumber: nextInvoiceNumber(state),
    clientId: client.id,
    status: "entwurf",
    issueDate,
    dueDate,
    paidAt: null,
    notes: sourceInvoice ? null : "Prototypischer Entwurf",
    lineItems,
  };
}

export function createInitialState() {
  return {
    today: "2026-05-11",
    selectedClientId: "client-1",
    selectedInvoiceId: "invoice-1",
    counters: {
      client: 2,
      invoice: 3,
      invoiceNumber: 3,
    },
    clients: [
      {
        id: "client-1",
        companyName: "Alpine Studio AG",
        contactPerson: "Mara Keller",
        city: "Zurich",
        email: "mara@alpine.example",
        paymentTermDays: 30,
      },
      {
        id: "client-2",
        companyName: "Nordlicht Consulting",
        contactPerson: "Timo Frei",
        city: "Basel",
        email: "timo@nordlicht.example",
        paymentTermDays: 14,
      },
    ],
    invoices: [
      {
        id: "invoice-1",
        invoiceNumber: "RE-2026-0001",
        clientId: "client-1",
        status: "entwurf",
        issueDate: "2026-05-11",
        dueDate: "2026-06-10",
        paidAt: null,
        notes: "Retainer Mai",
        lineItems: [
          { ...LINE_TEMPLATES[0], id: "line-1-1" },
          { ...LINE_TEMPLATES[2], id: "line-1-2" },
        ],
      },
      {
        id: "invoice-2",
        invoiceNumber: "RE-2026-0002",
        clientId: "client-2",
        status: "versendet",
        issueDate: "2026-04-22",
        dueDate: "2026-05-06",
        paidAt: null,
        notes: "Migration April",
        lineItems: [{ ...LINE_TEMPLATES[1], id: "line-2-1" }],
      },
      {
        id: "invoice-3",
        invoiceNumber: "RE-2026-0003",
        clientId: "client-1",
        status: "bezahlt",
        issueDate: "2026-03-12",
        dueDate: "2026-04-11",
        paidAt: "2026-03-30",
        notes: "Workshop",
        lineItems: [
          { ...LINE_TEMPLATES[0], id: "line-3-1", quantity: 4 },
          { ...LINE_TEMPLATES[3], id: "line-3-2" },
        ],
      },
    ],
    lastEvent: "Ready. Drive the model with the keys below.",
  };
}

export function calculateInvoiceTotals(invoice) {
  const vatByRate = new Map();
  let subtotal = 0;

  for (const item of invoice.lineItems) {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;
    if (item.vatRate > 0) {
      vatByRate.set(
        item.vatRate,
        (vatByRate.get(item.vatRate) ?? 0) + lineTotal * item.vatRate
      );
    }
  }

  const vat = [...vatByRate.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, amount]) => ({
      rate,
      amount: round2(amount),
    }));
  const subtotalRounded = round2(subtotal);
  const totalVat = vat.reduce((sum, row) => sum + row.amount, 0);

  return {
    subtotal: subtotalRounded,
    vat,
    total: round2(subtotalRounded + totalVat),
  };
}

export function buildDashboard(state) {
  const dashboard = {
    totalInvoiced: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    vatByQuarter: {
      Q1: {},
      Q2: {},
      Q3: {},
      Q4: {},
    },
    countsByStatus: {
      entwurf: 0,
      versendet: 0,
      bezahlt: 0,
    },
  };

  for (const invoice of state.invoices) {
    dashboard.countsByStatus[invoice.status] += 1;
    const totals = calculateInvoiceTotals(invoice);

    if (invoice.status !== "entwurf") {
      dashboard.totalInvoiced += totals.subtotal;
    }
    if (invoice.status === "versendet") {
      dashboard.totalOutstanding += totals.subtotal;
    }
    if (invoice.status === "bezahlt") {
      dashboard.totalPaid += totals.subtotal;
    }

    const month = Number(invoice.issueDate.slice(5, 7));
    const quarter = `Q${Math.ceil(month / 3)}`;
    for (const vatRow of totals.vat) {
      const key = `${(vatRow.rate * 100).toFixed(1)}%`;
      dashboard.vatByQuarter[quarter][key] =
        round2((dashboard.vatByQuarter[quarter][key] ?? 0) + vatRow.amount);
    }
  }

  dashboard.totalInvoiced = round2(dashboard.totalInvoiced);
  dashboard.totalOutstanding = round2(dashboard.totalOutstanding);
  dashboard.totalPaid = round2(dashboard.totalPaid);
  return dashboard;
}

export function reduce(state, action) {
  const draft = cloneState(state);
  const invoice = selectedInvoice(draft);
  const client = selectedClient(draft);

  switch (action.type) {
    case "selectNextClient": {
      if (draft.clients.length === 0) {
        return withEvent(draft, "No clients to select.");
      }
      const index = draft.clients.findIndex(
        (item) => item.id === draft.selectedClientId
      );
      const next = draft.clients[(index + 1) % draft.clients.length];
      draft.selectedClientId = next.id;
      return withEvent(draft, `Selected client ${next.companyName}.`);
    }

    case "selectNextInvoice": {
      if (draft.invoices.length === 0) {
        return withEvent(draft, "No invoices to select.");
      }
      const index = draft.invoices.findIndex(
        (item) => item.id === draft.selectedInvoiceId
      );
      const next = draft.invoices[(index + 1) % draft.invoices.length];
      draft.selectedInvoiceId = next.id;
      draft.selectedClientId = next.clientId;
      return withEvent(draft, `Selected invoice ${next.invoiceNumber}.`);
    }

    case "createClient": {
      const id = nextId("client", draft);
      const newClient = {
        id,
        companyName: `Prototype Kunde ${draft.counters.client + 1}`,
        contactPerson: "AFK Testperson",
        city: ["Bern", "Luzern", "St. Gallen"][draft.counters.client % 3],
        email: `kunde${draft.counters.client + 1}@example.test`,
        paymentTermDays: [10, 14, 30][draft.counters.client % 3],
      };
      draft.counters.client += 1;
      draft.clients.push(newClient);
      draft.selectedClientId = id;
      return withEvent(draft, `Created ${newClient.companyName}.`);
    }

    case "createDraftInvoice": {
      if (!client) {
        return withEvent(draft, "Create a client before creating an invoice.");
      }
      const newInvoice = invoiceFromTemplate(draft, client);
      draft.counters.invoice += 1;
      draft.counters.invoiceNumber += 1;
      draft.invoices.unshift(newInvoice);
      draft.selectedInvoiceId = newInvoice.id;
      return withEvent(
        draft,
        `Created draft ${newInvoice.invoiceNumber} for ${client.companyName}.`
      );
    }

    case "addLineItem": {
      if (!invoice) return withEvent(draft, "No selected invoice.");
      if (invoice.status !== "entwurf") {
        return withEvent(draft, "Only draft invoices can receive line items.");
      }
      const template =
        LINE_TEMPLATES[invoice.lineItems.length % LINE_TEMPLATES.length];
      invoice.lineItems.push({
        ...template,
        id: `line-${invoice.id}-${invoice.lineItems.length + 1}`,
      });
      return replaceInvoice(
        draft,
        invoice,
        `Added a line item to ${invoice.invoiceNumber}.`
      );
    }

    case "editDraftTerms": {
      if (!invoice) return withEvent(draft, "No selected invoice.");
      if (invoice.status !== "entwurf") {
        return withEvent(draft, "Only draft invoices can be edited.");
      }
      const firstItem = invoice.lineItems[0];
      invoice.dueDate = addDays(invoice.dueDate, 7);
      invoice.notes = "Edited in prototype: due date +7 days, first price +100.";
      if (firstItem) firstItem.unitPrice += 100;
      return replaceInvoice(
        draft,
        invoice,
        `Edited draft ${invoice.invoiceNumber}.`
      );
    }

    case "sendInvoice": {
      if (!invoice) return withEvent(draft, "No selected invoice.");
      if (invoice.status !== "entwurf") {
        return withEvent(draft, "Only drafts can be marked as sent.");
      }
      if (invoice.lineItems.length === 0) {
        return withEvent(draft, "A sent invoice needs at least one line item.");
      }
      invoice.status = "versendet";
      return replaceInvoice(
        draft,
        invoice,
        `${invoice.invoiceNumber} moved from entwurf to versendet.`
      );
    }

    case "markPaid": {
      if (!invoice) return withEvent(draft, "No selected invoice.");
      if (invoice.status !== "versendet") {
        return withEvent(draft, "Only sent invoices can be marked as paid.");
      }
      invoice.status = "bezahlt";
      invoice.paidAt = draft.today;
      return replaceInvoice(
        draft,
        invoice,
        `${invoice.invoiceNumber} moved from versendet to bezahlt.`
      );
    }

    case "duplicateInvoice": {
      if (!invoice) return withEvent(draft, "No selected invoice.");
      const sourceClient = invoiceClient(draft, invoice);
      if (!sourceClient) {
        return withEvent(draft, "Cannot duplicate without the source client.");
      }
      const newInvoice = invoiceFromTemplate(draft, sourceClient, invoice);
      draft.counters.invoice += 1;
      draft.counters.invoiceNumber += 1;
      draft.invoices.unshift(newInvoice);
      draft.selectedInvoiceId = newInvoice.id;
      draft.selectedClientId = sourceClient.id;
      return withEvent(
        draft,
        `Duplicated ${invoice.invoiceNumber} into draft ${newInvoice.invoiceNumber}.`
      );
    }

    case "deleteSelectedClient": {
      if (!client) return withEvent(draft, "No selected client.");
      const hasInvoices = draft.invoices.some(
        (item) => item.clientId === client.id
      );
      if (hasInvoices) {
        return withEvent(
          draft,
          `${client.companyName} cannot be deleted while invoices reference it.`
        );
      }
      draft.clients = draft.clients.filter((item) => item.id !== client.id);
      draft.selectedClientId = draft.clients[0]?.id ?? null;
      return withEvent(draft, `Deleted ${client.companyName}.`);
    }

    case "tickWeek": {
      draft.today = addDays(draft.today, 7);
      return withEvent(draft, `Advanced prototype date to ${draft.today}.`);
    }

    default:
      return withEvent(draft, "Unknown action.");
  }
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

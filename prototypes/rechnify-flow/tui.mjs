#!/usr/bin/env node
import {
  buildDashboard,
  calculateInvoiceTotals,
  createInitialState,
  reduce,
} from "./logic.mjs";

const ANSI = {
  clear: "\x1b[2J\x1b[H",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
};

const ACTIONS = {
  c: { label: "create client", type: "createClient" },
  n: { label: "new draft invoice", type: "createDraftInvoice" },
  a: { label: "add line item", type: "addLineItem" },
  e: { label: "edit draft terms", type: "editDraftTerms" },
  s: { label: "send draft", type: "sendInvoice" },
  p: { label: "mark sent paid", type: "markPaid" },
  u: { label: "duplicate invoice", type: "duplicateInvoice" },
  x: { label: "delete selected client", type: "deleteSelectedClient" },
  i: { label: "next invoice", type: "selectNextInvoice" },
  k: { label: "next client", type: "selectNextClient" },
  t: { label: "advance 7 days", type: "tickWeek" },
};

let state = createInitialState();

function chf(value) {
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function selectedInvoice() {
  return state.invoices.find((invoice) => invoice.id === state.selectedInvoiceId);
}

function selectedClient() {
  return state.clients.find((client) => client.id === state.selectedClientId);
}

function render() {
  const dashboard = buildDashboard(state);
  const invoice = selectedInvoice();
  const client = selectedClient();
  const totals = invoice ? calculateInvoiceTotals(invoice) : null;

  const lines = [
    `${ANSI.bold}Rechnify logic prototype${ANSI.reset}`,
    `${ANSI.dim}Question: can one model cover clients, invoice lifecycle, duplication, delete rules, VAT, and dashboard aggregates?${ANSI.reset}`,
    "",
    `${ANSI.bold}Clock${ANSI.reset} ${state.today}`,
    `${ANSI.bold}Selected client${ANSI.reset} ${
      client
        ? `${client.companyName} (${client.paymentTermDays} day term)`
        : "none"
    }`,
    `${ANSI.bold}Selected invoice${ANSI.reset} ${
      invoice
        ? `${invoice.invoiceNumber} ${invoice.status} CHF ${chf(totals.total)}`
        : "none"
    }`,
    "",
    `${ANSI.bold}Dashboard${ANSI.reset}`,
    `  invoiced net: CHF ${chf(dashboard.totalInvoiced)}  outstanding: CHF ${chf(
      dashboard.totalOutstanding
    )}  paid: CHF ${chf(dashboard.totalPaid)}`,
    `  counts: entwurf ${dashboard.countsByStatus.entwurf}, versendet ${dashboard.countsByStatus.versendet}, bezahlt ${dashboard.countsByStatus.bezahlt}`,
    `  VAT quarters: ${JSON.stringify(dashboard.vatByQuarter)}`,
    "",
    `${ANSI.bold}Invoices${ANSI.reset}`,
    ...state.invoices.map((item) => {
      const owner = state.clients.find((clientItem) => clientItem.id === item.clientId);
      const marker = item.id === state.selectedInvoiceId ? ">" : " ";
      const itemTotals = calculateInvoiceTotals(item);
      return `${marker} ${item.invoiceNumber}  ${item.status.padEnd(9)}  ${
        owner?.companyName ?? "missing client"
      }  due ${item.dueDate}  CHF ${chf(itemTotals.total)}`;
    }),
    "",
    `${ANSI.bold}Clients${ANSI.reset}`,
    ...state.clients.map((item) => {
      const marker = item.id === state.selectedClientId ? ">" : " ";
      const invoices = state.invoices.filter(
        (invoiceItem) => invoiceItem.clientId === item.id
      ).length;
      return `${marker} ${item.companyName}  ${item.city}  ${item.paymentTermDays} days  invoices ${invoices}`;
    }),
    "",
    `${ANSI.bold}Selected invoice state${ANSI.reset}`,
    invoice
      ? JSON.stringify(
          {
            id: invoice.id,
            number: invoice.invoiceNumber,
            status: invoice.status,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            paidAt: invoice.paidAt,
            lineItems: invoice.lineItems,
            totals,
          },
          null,
          2
        )
      : "null",
    "",
    `${ANSI.bold}Last event${ANSI.reset} ${state.lastEvent}`,
    "",
    `${ANSI.bold}Keys${ANSI.reset} ${Object.entries(ACTIONS)
      .map(([key, action]) => `[${key}] ${action.label}`)
      .join("  ")}  [q] quit`,
  ];

  process.stdout.write(`${ANSI.clear}${lines.join("\n")}\n`);
}

function dispatch(action) {
  state = reduce(state, action);
  render();
}

if (process.argv.includes("--snapshot")) {
  render();
  process.exit(0);
}

render();

if (!process.stdin.isTTY) {
  process.stdout.write(
    "\nstdin is not interactive. Run this command in a terminal to drive it.\n"
  );
  process.exit(0);
}

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", (key) => {
  if (key === "\u0003" || key === "q") {
    process.stdout.write(`${ANSI.reset}\n`);
    process.exit(0);
  }
  const action = ACTIONS[key];
  if (action) dispatch({ type: action.type });
});

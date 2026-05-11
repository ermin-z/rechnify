import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { SwissQRBill } from "swissqrbill/pdf";
import { formatChf, formatDate } from "./format";
import { qrBillData } from "./qr-bill-generator";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const QR_BILL_HEIGHT = 297.64;
const LEFT = 42;
const RIGHT = 42;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;
const QR_BILL_TOP = PAGE_HEIGHT - QR_BILL_HEIGHT;

interface PdfLineItem {
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  vat_rate: string;
}

interface VatRow {
  rate: number;
  amount: number;
}

interface InvoicePdfInput {
  freelancer: {
    name: string;
    street: string;
    zip: string;
    city: string;
    uid: string;
    iban: string;
  };
  client: {
    companyName: string;
    contactPerson: string | null;
    street: string;
    zip: string;
    city: string;
    country: string;
    uid: string | null;
  };
  invoice: {
    number: string;
    issueDate: string;
    dueDate: string;
    notes: string | null;
  };
  lineItems: PdfLineItem[];
  vat: {
    subtotal_excl_vat: number;
    vat_by_rate: VatRow[];
    total_incl_vat: number;
  };
}

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function money(value: number | string): string {
  return `CHF ${formatChf(value)}`;
}

function writeMutedLabel(doc: PDFKit.PDFDocument, label: string, x: number, y: number) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor("#6b7280")
    .text(label.toUpperCase(), x, y, { characterSpacing: 0.4 });
}

function textRight(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number
) {
  doc.text(text, x, y, { width, align: "right" });
}

function renderHeader(doc: PDFKit.PDFDocument, input: InvoicePdfInput) {
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(22);
  doc.text("Rechnung", LEFT, 42);

  doc.fontSize(10).font("Helvetica").fillColor("#374151");
  doc.text(input.freelancer.name, 390, 42, { width: 160, align: "right" });
  doc.text(input.freelancer.street, 390, 56, { width: 160, align: "right" });
  doc.text(`${input.freelancer.zip} ${input.freelancer.city}`, 390, 70, {
    width: 160,
    align: "right",
  });
  doc.text(input.freelancer.uid, 390, 84, { width: 160, align: "right" });
}

function renderAddresses(doc: PDFKit.PDFDocument, input: InvoicePdfInput) {
  writeMutedLabel(doc, "Rechnung an", LEFT, 118);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827");
  doc.text(input.client.companyName, LEFT, 134);
  doc.font("Helvetica").fontSize(10).fillColor("#374151");
  let y = 150;
  if (input.client.contactPerson) {
    doc.text(input.client.contactPerson, LEFT, y);
    y += 14;
  }
  doc.text(input.client.street, LEFT, y);
  y += 14;
  doc.text(`${input.client.zip} ${input.client.city}`, LEFT, y);
  y += 14;
  doc.text(input.client.country, LEFT, y);
  if (input.client.uid) {
    y += 14;
    doc.text(input.client.uid, LEFT, y);
  }

  const metaX = 360;
  const valueX = 452;
  const rows = [
    ["Nr.", input.invoice.number],
    ["Datum", formatDate(input.invoice.issueDate)],
    ["Faellig", formatDate(input.invoice.dueDate)],
  ];

  rows.forEach(([label, value], index) => {
    const rowY = 126 + index * 22;
    writeMutedLabel(doc, label, metaX, rowY);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827");
    textRight(doc, value, valueX, rowY, 98);
  });
}

function renderTable(doc: PDFKit.PDFDocument, input: InvoicePdfInput) {
  const top = 236;
  const columns = {
    description: LEFT,
    quantity: 286,
    unit: 334,
    price: 374,
    vat: 444,
    total: 492,
  };

  doc
    .roundedRect(LEFT, top - 10, CONTENT_WIDTH, 26, 4)
    .fill("#f3f4f6")
    .fillColor("#4b5563")
    .font("Helvetica-Bold")
    .fontSize(8);

  doc.text("Beschreibung", columns.description + 8, top);
  textRight(doc, "Menge", columns.quantity, top, 38);
  doc.text("Einheit", columns.unit, top, { width: 36 });
  textRight(doc, "Preis", columns.price, top, 58);
  textRight(doc, "MwSt.", columns.vat, top, 38);
  textRight(doc, "Betrag", columns.total, top, 50);

  let y = top + 28;
  doc.font("Helvetica").fontSize(9).fillColor("#111827");

  input.lineItems.forEach((item) => {
    const lineTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
    const rate = parseFloat(item.vat_rate);
    const descriptionHeight = doc.heightOfString(item.description, {
      width: 230,
    });
    const rowHeight = Math.max(22, descriptionHeight + 8);

    doc
      .moveTo(LEFT, y - 6)
      .lineTo(LEFT + CONTENT_WIDTH, y - 6)
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .stroke();

    doc.fillColor("#111827").font("Helvetica").fontSize(9);
    doc.text(item.description, columns.description + 8, y, { width: 230 });
    textRight(doc, item.quantity, columns.quantity, y, 38);
    doc.text(item.unit, columns.unit, y, { width: 36 });
    textRight(doc, money(item.unit_price), columns.price, y, 58);
    textRight(doc, `${(rate * 100).toFixed(1)} %`, columns.vat, y, 38);
    doc.font("Helvetica-Bold");
    textRight(doc, money(lineTotal), columns.total, y, 50);

    y += rowHeight;
  });

  return y + 12;
}

function renderTotals(doc: PDFKit.PDFDocument, input: InvoicePdfInput, startY: number) {
  const labelX = 340;
  const valueX = 460;
  let y = Math.min(startY, QR_BILL_TOP - 108);

  doc
    .moveTo(labelX, y - 8)
    .lineTo(LEFT + CONTENT_WIDTH, y - 8)
    .strokeColor("#e5e7eb")
    .lineWidth(0.5)
    .stroke();

  doc.font("Helvetica").fontSize(9).fillColor("#374151");
  doc.text("Subtotal exkl. MwSt.", labelX, y);
  textRight(doc, money(input.vat.subtotal_excl_vat), valueX, y, 90);
  y += 17;

  input.vat.vat_by_rate.forEach(({ rate, amount }) => {
    doc.text(`MwSt. ${(rate * 100).toFixed(1)} %`, labelX, y);
    textRight(doc, money(amount), valueX, y, 90);
    y += 17;
  });

  doc
    .moveTo(labelX, y - 4)
    .lineTo(LEFT + CONTENT_WIDTH, y - 4)
    .strokeColor("#111827")
    .lineWidth(0.8)
    .stroke();
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827");
  doc.text("Total inkl. MwSt.", labelX, y + 4);
  textRight(doc, money(input.vat.total_incl_vat), valueX, y + 4, 90);
}

function renderNotes(doc: PDFKit.PDFDocument, input: InvoicePdfInput) {
  if (!input.invoice.notes) return;

  writeMutedLabel(doc, "Notizen", LEFT, QR_BILL_TOP - 76);
  doc.font("Helvetica").fontSize(9).fillColor("#374151");
  doc.text(input.invoice.notes, LEFT, QR_BILL_TOP - 60, {
    width: 250,
    height: 42,
  });
}

export async function renderInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, left: 0, bottom: 0, right: 0 },
    autoFirstPage: true,
    bufferPages: false,
    info: {
      Title: `Rechnung ${input.invoice.number}`,
      Author: input.freelancer.name,
      Subject: `Rechnung ${input.invoice.number}`,
    },
  });

  const done = collectPdf(doc);

  renderHeader(doc, input);
  renderAddresses(doc, input);
  const tableEnd = renderTable(doc, input);
  renderNotes(doc, input);
  renderTotals(doc, input, tableEnd);

  const data = qrBillData({
    iban: input.freelancer.iban,
    creditorName: input.freelancer.name,
    creditorStreet: input.freelancer.street,
    creditorZip: input.freelancer.zip,
    creditorCity: input.freelancer.city,
    creditorCountry: "CH",
    amount: input.vat.total_incl_vat,
    currency: "CHF",
    invoiceNumber: input.invoice.number,
    debtorName: input.client.companyName,
    debtorStreet: input.client.street,
    debtorZip: input.client.zip,
    debtorCity: input.client.city,
    debtorCountry: input.client.country,
  });

  const qrBill = new SwissQRBill(data, {
    language: "DE",
    scissors: false,
    separate: true,
  });
  qrBill.attachTo(doc, 0, QR_BILL_TOP);

  doc.end();
  return done;
}

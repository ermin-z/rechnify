import { asc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, invoiceLineItems, invoices } from "@/lib/db/schema";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { calculateVat } from "@/lib/vat-calculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function filename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
    .select({
      invoice: invoices,
      client: clients,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.client_id, clients.id))
    .where(eq(invoices.id, id));

  if (!row) notFound();

  const items = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoice_id, id))
    .orderBy(asc(invoiceLineItems.position));

  const vat = calculateVat(
    items.map((item) => ({
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      vat_rate: parseFloat(item.vat_rate),
    }))
  );

  const pdf = await renderInvoicePdf({
    freelancer: {
      name: requireEnv("FREELANCER_NAME"),
      street: requireEnv("FREELANCER_STREET"),
      zip: requireEnv("FREELANCER_ZIP"),
      city: requireEnv("FREELANCER_CITY"),
      uid: requireEnv("FREELANCER_UID"),
      iban: requireEnv("FREELANCER_IBAN"),
    },
    client: {
      companyName: row.client.company_name,
      contactPerson: row.client.contact_person,
      street: row.client.street,
      zip: row.client.zip,
      city: row.client.city,
      country: row.client.country,
      uid: row.client.uid,
    },
    invoice: {
      number: row.invoice.invoice_number,
      issueDate: row.invoice.issue_date,
      dueDate: row.invoice.due_date,
      notes: row.invoice.notes,
    },
    lineItems: items,
    vat,
  });

  const body = new Uint8Array(pdf);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename(
        row.invoice.invoice_number
      )}.pdf"`,
      "Content-Length": pdf.byteLength.toString(),
    },
  });
}

"use server";

import { and, eq, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { invoiceLineItems, invoices } from "@/lib/db/schema";
import { generateInvoiceNumber } from "@/lib/invoice-number-generator";

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await db
    .select({
      lastSeq: max(
        sql<number>`CAST(SPLIT_PART(${invoices.invoice_number}, '-', 2) AS INTEGER)`
      ),
    })
    .from(invoices)
    .where(sql`EXTRACT(YEAR FROM ${invoices.issue_date}::date) = ${year}`);
  const lastSeq = row?.lastSeq != null ? Number(row.lastSeq) : null;
  return generateInvoiceNumber(year, lastSeq);
}

interface LineItemInput {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
}

function parseLineItems(formData: FormData): LineItemInput[] {
  return JSON.parse(formData.get("line_items") as string);
}

function invoiceFields(formData: FormData) {
  return {
    client_id: formData.get("client_id") as string,
    issue_date: formData.get("issue_date") as string,
    due_date: formData.get("due_date") as string,
    notes: (formData.get("notes") as string) || null,
  };
}

function lineItemRows(invoiceId: string, items: LineItemInput[]) {
  return items.map((item, index) => ({
    invoice_id: invoiceId,
    position: index + 1,
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit,
    unit_price: item.unit_price.toString(),
    vat_rate: item.vat_rate.toString(),
  }));
}

export async function createInvoice(formData: FormData) {
  const fields = invoiceFields(formData);
  const items = parseLineItems(formData);

  if (items.length === 0) {
    throw new Error("Eine Rechnung braucht mindestens eine Position.");
  }

  const invoiceNumber = await nextInvoiceNumber();

  let invoiceId!: string;
  await db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({ ...fields, invoice_number: invoiceNumber, status: "entwurf" })
      .returning({ id: invoices.id });

    await tx.insert(invoiceLineItems).values(lineItemRows(invoice.id, items));
    invoiceId = invoice.id;
  });

  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${invoiceId}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  const fields = invoiceFields(formData);
  const items = parseLineItems(formData);

  if (items.length === 0) {
    throw new Error("Eine Rechnung braucht mindestens eine Position.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
      .set({ ...fields, updated_at: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.status, "entwurf")));

    await tx
      .delete(invoiceLineItems)
      .where(eq(invoiceLineItems.invoice_id, id));

    await tx.insert(invoiceLineItems).values(lineItemRows(id, items));
  });

  revalidatePath(`/rechnungen/${id}`);
  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${id}`);
}

export async function markAsVersendet(id: string) {
  await db
    .update(invoices)
    .set({ status: "versendet", updated_at: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.status, "entwurf")));

  revalidatePath(`/rechnungen/${id}`);
  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${id}`);
}

export async function markAsBezahlt(id: string, formData: FormData) {
  const paidAt = formData.get("paid_at") as string;

  await db
    .update(invoices)
    .set({ status: "bezahlt", paid_at: paidAt, updated_at: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.status, "versendet")));

  revalidatePath(`/rechnungen/${id}`);
  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${id}`);
}

export async function duplicateInvoice(id: string) {
  const [source] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id));

  if (!source) throw new Error("Rechnung nicht gefunden.");

  const sourceItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoice_id, id));

  const [client] = await db
    .select({ payment_term_days: sql<number>`payment_term_days` })
    .from(sql`clients`)
    .where(sql`id = ${source.client_id}`);

  const today = new Date().toISOString().split("T")[0];
  const due = new Date();
  due.setDate(due.getDate() + (client?.payment_term_days ?? 30));
  const dueDate = due.toISOString().split("T")[0];

  const invoiceNumber = await nextInvoiceNumber();

  let newId!: string;
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(invoices)
      .values({
        invoice_number: invoiceNumber,
        client_id: source.client_id,
        status: "entwurf",
        issue_date: today,
        due_date: dueDate,
        notes: null,
      })
      .returning({ id: invoices.id });

    if (sourceItems.length > 0) {
      await tx.insert(invoiceLineItems).values(
        sourceItems.map((item) => ({
          invoice_id: created.id,
          position: item.position,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
        }))
      );
    }

    newId = created.id;
  });

  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${newId}`);
}

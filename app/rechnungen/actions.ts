"use server";

import { desc, eq, max, sql } from "drizzle-orm";
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
    .where(
      sql`EXTRACT(YEAR FROM ${invoices.issue_date}::date) = ${year}`
    );
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

export async function createInvoice(formData: FormData) {
  const clientId = formData.get("client_id") as string;
  const issueDate = formData.get("issue_date") as string;
  const dueDate = formData.get("due_date") as string;
  const notes = (formData.get("notes") as string) || null;
  const lineItems: LineItemInput[] = JSON.parse(
    formData.get("line_items") as string
  );

  if (lineItems.length === 0) {
    throw new Error("Eine Rechnung braucht mindestens eine Position.");
  }

  const invoiceNumber = await nextInvoiceNumber();

  let invoiceId: string;
  await db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoice_number: invoiceNumber,
        client_id: clientId,
        status: "entwurf",
        issue_date: issueDate,
        due_date: dueDate,
        notes,
      })
      .returning({ id: invoices.id });

    await tx.insert(invoiceLineItems).values(
      lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        position: index + 1,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unit_price: item.unit_price.toString(),
        vat_rate: item.vat_rate.toString(),
      }))
    );

    invoiceId = invoice.id;
  });

  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${invoiceId!}`);
}

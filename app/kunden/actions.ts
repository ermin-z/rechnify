"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clients, invoices } from "@/lib/db/schema";

function parseFormData(formData: FormData) {
  return {
    company_name: formData.get("company_name") as string,
    contact_person: (formData.get("contact_person") as string) || null,
    street: formData.get("street") as string,
    zip: formData.get("zip") as string,
    city: formData.get("city") as string,
    country: formData.get("country") as string,
    email: formData.get("email") as string,
    uid: (formData.get("uid") as string) || null,
    payment_term_days:
      parseInt(formData.get("payment_term_days") as string, 10) || 30,
    notes: (formData.get("notes") as string) || null,
  };
}

export async function createClient(formData: FormData) {
  const data = parseFormData(formData);
  const [client] = await db.insert(clients).values(data).returning();
  redirect(`/kunden/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  const data = { ...parseFormData(formData), updated_at: new Date() };
  await db.update(clients).set(data).where(eq(clients.id, id));
  revalidatePath(`/kunden/${id}`);
  revalidatePath("/kunden");
  redirect(`/kunden/${id}`);
}

export async function deleteClient(
  id: string
): Promise<{ error: string } | void> {
  const [result] = await db
    .select({ total: count() })
    .from(invoices)
    .where(eq(invoices.client_id, id));

  if (result.total > 0) {
    return {
      error: "Dieser Kunde kann nicht gelöscht werden, da noch Rechnungen vorhanden sind.",
    };
  }

  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/kunden");
  redirect("/kunden");
}

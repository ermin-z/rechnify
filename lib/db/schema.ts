import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "entwurf",
  "versendet",
  "bezahlt",
]);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_name: text("company_name").notNull(),
  contact_person: text("contact_person"),
  street: text("street").notNull(),
  zip: text("zip").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("CH"),
  email: text("email").notNull(),
  uid: text("uid"),
  payment_term_days: integer("payment_term_days").notNull().default(30),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_number: text("invoice_number").notNull().unique(),
  client_id: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  status: invoiceStatusEnum("status").notNull().default("entwurf"),
  issue_date: date("issue_date").notNull(),
  due_date: date("due_date").notNull(),
  paid_at: date("paid_at"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_id: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  vat_rate: numeric("vat_rate", { precision: 5, scale: 4 }).notNull(),
});

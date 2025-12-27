import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  code: text("code").notNull().unique(),
  hsnCode: text("hsn_code").default("8708"),
  stock: integer("stock").notNull().default(0),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
  maxDiscount: numeric("max_discount", { precision: 5, scale: 2 }).default("0"),
  gstRate: integer("gst_rate").notNull().default(28),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shopName: text("shop_name").default("Brothers Enterprises"),
  shopAddress: text("shop_address").default(""),
  shopPhone: text("shop_phone").default("+91 98765 43210"),
  shopGSTIN: text("shop_gstin").default("29XXXXX1234X1Z5"),
  customText1: text("custom_text_1").default("All goods once sold will not be taken back"),
  customText2: text("custom_text_2").default("Warranty as per manufacturer terms"),
  customText3: text("custom_text_3").default("Payment due within 30 days"),
  logoPath: text("logo_path").default(""),
  signaturePath: text("signature_path").default(""),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const invoices = pgTable("invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  items: text("items").notNull(), // JSON stringified
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).notNull(),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).partial().omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

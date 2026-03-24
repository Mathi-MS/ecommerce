import { pgTable, text, serial, timestamp, varchar, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discountPrice: numeric("discount_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  images: text("images").notNull().default("[]"),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  referralCode: varchar("referral_code", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductRow = typeof productsTable.$inferSelect;

import { pgTable, text, serial, timestamp, varchar, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const referralCodesTable = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  maxUsage: integer("max_usage"),
  productId: integer("product_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodesTable).omit({ id: true, createdAt: true, usageCount: true });
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodesTable.$inferSelect;

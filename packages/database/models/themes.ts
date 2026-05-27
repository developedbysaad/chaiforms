import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { ThemeConfig } from "./types";

export const themes = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  config: jsonb("config").$type<ThemeConfig>().notNull(),
  isBuiltIn: boolean("is_built_in").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;

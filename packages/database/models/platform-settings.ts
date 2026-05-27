import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Simple key/value store for admin-controlled feature flags. The `key` is a
 * stable string (e.g. `integration:discord`, `integration:sheets`) and `value`
 * holds an arbitrary JSON blob — for integrations it's `{ enabled: boolean }`.
 */
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;

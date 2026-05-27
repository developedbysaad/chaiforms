import { index, jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { forms } from "./forms";
import type { AnalyticsMetadata } from "./types";

export const analyticsEventEnum = pgEnum("analytics_event", [
  "view",
  "start",
  "submit",
  "abandon",
]);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    event: analyticsEventEnum("event").notNull(),
    metadata: jsonb("metadata").$type<AnalyticsMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    formIdx: index("analytics_form_id_idx").on(t.formId),
    createdIdx: index("analytics_created_at_idx").on(t.createdAt),
  }),
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

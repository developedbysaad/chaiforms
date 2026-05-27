import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { forms } from "./forms";
import type { FormIntegrationConfig, IntegrationType } from "./types";

/**
 * Per-form response integrations. One row per (form, type). `config` is a
 * type-specific JSON blob:
 *   • discord → { webhookUrl }
 *   • sheets  → { spreadsheetId, sheetName }
 */
export const formIntegrations = pgTable(
  "form_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    type: text("type").$type<IntegrationType>().notNull(),
    config: jsonb("config").$type<FormIntegrationConfig>().notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    formIdx: index("form_integrations_form_id_idx").on(t.formId),
  }),
);

export type FormIntegration = typeof formIntegrations.$inferSelect;
export type NewFormIntegration = typeof formIntegrations.$inferInsert;

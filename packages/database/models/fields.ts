import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { forms } from "./forms";
import type { ConditionalLogic, FieldConfig } from "./types";

export const fieldTypeEnum = pgEnum("field_type", [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "rating",
  "date",
  "phone",
  "url",
  "linear_scale",
  "ranking",
  "address",
  "time",
  "signature",
  "file_upload",
  "page_break",
]);

export const fields = pgTable(
  "fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    type: fieldTypeEnum("type").notNull(),
    label: text("label").notNull(),
    placeholder: text("placeholder"),
    helpText: text("help_text"),
    required: boolean("required").notNull().default(false),
    order: integer("order").notNull(),
    config: jsonb("config").$type<FieldConfig>().notNull().default({}),
    conditionalLogic: jsonb("conditional_logic").$type<ConditionalLogic>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    formIdx: index("fields_form_id_idx").on(t.formId),
  }),
);

export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;

import { jsonb, pgTable, uuid } from "drizzle-orm/pg-core";

import { fields } from "./fields";
import { responses } from "./responses";
import type { ResponseValue } from "./types";

export const responseValues = pgTable("response_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => responses.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  value: jsonb("value").$type<ResponseValue>(),
});

export type ResponseValueRow = typeof responseValues.$inferSelect;
export type NewResponseValue = typeof responseValues.$inferInsert;

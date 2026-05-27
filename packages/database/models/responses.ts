import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { forms } from "./forms";

export const submissionTypeEnum = pgEnum("submission_type", ["hosted", "endpoint"]);

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    submissionType: submissionTypeEnum("submission_type").notNull().default("hosted"),
    submitterEmail: text("submitter_email"),
    submitterName: text("submitter_name"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    country: text("country"),
    completionTime: integer("completion_time"),
    // For endpoint submissions: the whole arbitrary payload. Null for hosted.
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    spamFlagged: boolean("spam_flagged").notNull().default(false),
    spamReason: text("spam_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    formIdx: index("responses_form_id_idx").on(t.formId),
    createdIdx: index("responses_created_at_idx").on(t.createdAt),
  }),
);

export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;

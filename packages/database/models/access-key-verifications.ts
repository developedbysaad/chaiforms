import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { forms } from "./forms";

/**
 * Single-use, time-bound tokens emailed to the recipient when an endpoint
 * form is created or its recipient is changed. The link in the email hits
 * /api/verify-access-key/<token> which flips forms.accessKeyVerifiedAt.
 */
export const accessKeyVerifications = pgTable(
  "access_key_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    recipientEmail: text("recipient_email").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    formIdx: index("akv_form_id_idx").on(t.formId),
    tokenIdx: index("akv_token_idx").on(t.token),
  }),
);

export type AccessKeyVerification = typeof accessKeyVerifications.$inferSelect;
export type NewAccessKeyVerification = typeof accessKeyVerifications.$inferInsert;

import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { forms } from "./forms";
import { users } from "./users";

export const endpointAuditActionEnum = pgEnum("endpoint_audit_action", [
  "key_rotated",
  "recipient_changed",
  "captcha_toggled",
  "allowlist_changed",
  "verification_sent",
  "verified",
]);

export const endpointAudit = pgTable(
  "endpoint_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: endpointAuditActionEnum("action").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    formIdx: index("endpoint_audit_form_id_idx").on(t.formId),
  }),
);

export type EndpointAudit = typeof endpointAudit.$inferSelect;
export type NewEndpointAudit = typeof endpointAudit.$inferInsert;

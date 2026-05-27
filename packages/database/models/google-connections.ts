import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { EncryptedSecret } from "./types";
import { users } from "./users";

/**
 * A user's Google OAuth connection for the Sheets integration. `tokensEnc` is an
 * AES-256-GCM `EncryptedSecret` (same scheme as captcha/AI keys) holding the
 * JSON-stringified `{ access_token, refresh_token, expiry_date }`. One row per
 * user (unique).
 */
export const googleConnections = pgTable("google_connections", {
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  tokensEnc: jsonb("tokens_enc").$type<EncryptedSecret>().notNull(),
  googleEmail: text("google_email"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type GoogleConnection = typeof googleConnections.$inferSelect;
export type NewGoogleConnection = typeof googleConnections.$inferInsert;

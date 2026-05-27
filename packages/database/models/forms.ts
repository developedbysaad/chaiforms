import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { themes } from "./themes";
import type { EndpointSettings, FormSettings } from "./types";
import { users } from "./users";

export const formStatusEnum = pgEnum("form_status", ["draft", "published", "archived"]);
export const formVisibilityEnum = pgEnum("form_visibility", ["public", "unlisted"]);
export const formTypeEnum = pgEnum("form_type", ["hosted", "endpoint"]);

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    themeId: uuid("theme_id")
      .notNull()
      .references(() => themes.id),

    title: text("title").notNull(),
    description: text("description"),
    coverImage: text("cover_image"),

    type: formTypeEnum("type").notNull().default("hosted"),
    status: formStatusEnum("status").notNull().default("draft"),
    visibility: formVisibilityEnum("visibility").notNull().default("unlisted"),

    settings: jsonb("settings").$type<FormSettings>().notNull(),

    // Endpoint-form fields (null for hosted forms)
    accessKey: text("access_key").unique(),
    accessKeyVerifiedAt: timestamp("access_key_verified_at", { withTimezone: true }),
    recipientEmail: text("recipient_email"),
    websiteUrl: text("website_url"),
    allowedOrigins: text("allowed_origins").array(),
    endpointSettings: jsonb("endpoint_settings").$type<EndpointSettings>(),

    maxResponses: integer("max_responses"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    responseCount: integer("response_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    lastSubmittedAt: timestamp("last_submitted_at", { withTimezone: true }),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("forms_user_id_idx").on(t.userId),
    exploreIdx: index("forms_explore_idx").on(t.status, t.visibility),
    accessKeyIdx: index("forms_access_key_idx").on(t.accessKey),
    typeIdx: index("forms_type_idx").on(t.type),
  }),
);

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;

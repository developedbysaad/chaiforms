import { and, eq, schema } from "@repo/database";
import {
  assertFormOwner,
  GOOGLE_OAUTH_SCOPES,
  googleOAuthClient,
  integrationAvailability,
} from "@repo/services";
import {
  adminSetIntegrationEnabledSchema,
  formIntegrationIdSchema,
  integrationKeySchema,
  listFormIntegrationsSchema,
  upsertFormIntegrationSchema,
  type IntegrationKey,
} from "@repo/services/validators";
import { TRPCError } from "@trpc/server";

import type { Context } from "../../context";
import { adminProcedure, protectedProcedure, router } from "../../trpc";

const INTEGRATION_META: Record<
  IntegrationKey,
  { name: string; requiredEnv: string[] }
> = {
  discord: { name: "Discord", requiredEnv: [] },
  sheets: {
    name: "Google Sheets",
    requiredEnv: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"],
  },
};

/** Read the platform-wide enabled flag for an integration key. */
async function readEnabled(db: Context["db"], key: IntegrationKey): Promise<boolean> {
  const row = await db.query.platformSettings.findFirst({
    where: eq(schema.platformSettings.key, `integration:${key}`),
  });
  return !!(row?.value as { enabled?: boolean } | undefined)?.enabled;
}

export const integrationsRouter = router({
  /** Admin: list every integration with availability + enabled state. */
  adminList: adminProcedure.query(async ({ ctx }) => {
    const availability = integrationAvailability();
    const keys = integrationKeySchema.options;
    const rows = await Promise.all(
      keys.map(async (key) => ({
        key,
        name: INTEGRATION_META[key].name,
        available: availability[key],
        enabled: await readEnabled(ctx.db, key),
        requiredEnv: INTEGRATION_META[key].requiredEnv,
      })),
    );
    return rows;
  }),

  /** Admin: flip a platform-wide integration flag. Only allowed when available. */
  adminSetEnabled: adminProcedure
    .input(adminSetIntegrationEnabledSchema)
    .mutation(async ({ ctx, input }) => {
      const availability = integrationAvailability();
      if (input.enabled && !availability[input.key]) {
        const meta = INTEGRATION_META[input.key];
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Configure ${meta.requiredEnv.join(" and ")} to enable`,
        });
      }
      await ctx.db
        .insert(schema.platformSettings)
        .values({
          key: `integration:${input.key}`,
          value: { enabled: input.enabled },
        })
        .onConflictDoUpdate({
          target: schema.platformSettings.key,
          set: { value: { enabled: input.enabled }, updatedAt: new Date() },
        });
      return { ok: true, key: input.key, enabled: input.enabled };
    }),

  /** Which integrations are platform-enabled (for the builder UI). */
  listEnabled: protectedProcedure.query(async ({ ctx }) => {
    const availability = integrationAvailability();
    const keys = integrationKeySchema.options;
    const rows = await Promise.all(
      keys.map(async (key) => ({
        key,
        name: INTEGRATION_META[key].name,
        available: availability[key],
        enabled: availability[key] && (await readEnabled(ctx.db, key)),
      })),
    );
    // The builder only cares about integrations it can actually use.
    return rows.filter((r) => r.enabled);
  }),

  /** List a form's configured integrations (ownership-guarded). */
  listForForm: protectedProcedure
    .input(listFormIntegrationsSchema)
    .query(async ({ ctx, input }) => {
      await assertFormOwner(ctx.db, input.formId, ctx.user.id);
      const rows = await ctx.db.query.formIntegrations.findMany({
        where: eq(schema.formIntegrations.formId, input.formId),
      });
      return rows.map((r) => ({
        id: r.id,
        type: r.type,
        config: r.config,
        enabled: r.enabled,
      }));
    }),

  /** Upsert a per-form integration (ownership-guarded; rejects non-enabled types). */
  upsertForForm: protectedProcedure
    .input(upsertFormIntegrationSchema)
    .mutation(async ({ ctx, input }) => {
      await assertFormOwner(ctx.db, input.formId, ctx.user.id);

      const availability = integrationAvailability();
      if (!availability[input.type] || !(await readEnabled(ctx.db, input.type))) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `The ${INTEGRATION_META[input.type].name} integration isn't enabled on this platform.`,
        });
      }

      // For Sheets, require the owner to have connected Google first.
      if (input.type === "sheets") {
        const conn = await ctx.db.query.googleConnections.findFirst({
          where: eq(schema.googleConnections.userId, ctx.user.id),
          columns: { userId: true },
        });
        if (!conn) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Connect your Google account before enabling Sheets.",
          });
        }
      }

      const existing = await ctx.db.query.formIntegrations.findFirst({
        where: and(
          eq(schema.formIntegrations.formId, input.formId),
          eq(schema.formIntegrations.type, input.type),
        ),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(schema.formIntegrations)
          .set({
            config: input.config,
            enabled: input.enabled ?? existing.enabled,
          })
          .where(eq(schema.formIntegrations.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(schema.formIntegrations)
        .values({
          formId: input.formId,
          type: input.type,
          config: input.config,
          enabled: input.enabled ?? true,
        })
        .returning();
      return created;
    }),

  /** Remove a per-form integration (ownership-guarded). */
  deleteForForm: protectedProcedure
    .input(formIntegrationIdSchema)
    .mutation(async ({ ctx, input }) => {
      await assertFormOwner(ctx.db, input.formId, ctx.user.id);
      await ctx.db
        .delete(schema.formIntegrations)
        .where(
          and(
            eq(schema.formIntegrations.formId, input.formId),
            eq(schema.formIntegrations.type, input.type),
          ),
        );
      return { ok: true };
    }),

  /* ---- Google OAuth -------------------------------------------------------- */

  /** Build the Google consent URL (Sheets connect). */
  googleAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    const oauth = googleOAuthClient();
    if (!oauth) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Google Sheets isn't configured on this platform (missing GOOGLE_OAUTH_CLIENT_ID/SECRET).",
      });
    }
    const url = oauth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: GOOGLE_OAUTH_SCOPES,
      // Carry the user id so the callback knows whose tokens to store.
      state: ctx.user.id,
    });
    return { url };
  }),

  /** Whether the signed-in user has connected Google, and which account. */
  googleStatus: protectedProcedure.query(async ({ ctx }) => {
    const conn = await ctx.db.query.googleConnections.findFirst({
      where: eq(schema.googleConnections.userId, ctx.user.id),
      columns: { googleEmail: true },
    });
    return {
      connected: !!conn,
      email: conn?.googleEmail ?? null,
      available: integrationAvailability().sheets,
    };
  }),

  /** Disconnect Google for the signed-in user. */
  googleDisconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(schema.googleConnections)
      .where(eq(schema.googleConnections.userId, ctx.user.id));
    return { ok: true };
  }),
});

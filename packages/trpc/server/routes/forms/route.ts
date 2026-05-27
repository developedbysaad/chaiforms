import { and, desc, eq, ilike, or, schema, sql } from "@repo/database";
import { assertFormOwner, makeAutoSlug } from "@repo/services";
import {
  createFormSchema,
  formIdSchema,
  listFormsSchema,
  setPasswordSchema,
  updateFormSchema,
} from "@repo/services/validators";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

const HOSTED_DEFAULT_SETTINGS = {
  allowMultipleSubmissions: true,
  requireEmail: false,
  sendConfirmationEmail: false,
  notifyCreator: true,
  successMessage: "Got it. Thanks for filling this out.",
  redirectUrl: null,
  passwordHash: null,
} as const;

export const formsRouter = router({
  list: protectedProcedure.input(listFormsSchema).query(async ({ ctx, input }) => {
    const where = and(
      eq(schema.forms.userId, ctx.user.id),
      eq(schema.forms.type, "hosted"),
      input.status ? eq(schema.forms.status, input.status) : undefined,
      input.search
        ? or(
            ilike(schema.forms.title, `%${input.search}%`),
            ilike(schema.forms.slug, `%${input.search}%`),
          )
        : undefined,
    );

    const rows = await ctx.db
      .select({
        id: schema.forms.id,
        slug: schema.forms.slug,
        title: schema.forms.title,
        description: schema.forms.description,
        status: schema.forms.status,
        visibility: schema.forms.visibility,
        responseCount: schema.forms.responseCount,
        viewCount: schema.forms.viewCount,
        publishedAt: schema.forms.publishedAt,
        updatedAt: schema.forms.updatedAt,
        createdAt: schema.forms.createdAt,
      })
      .from(schema.forms)
      .where(where)
      .orderBy(desc(schema.forms.updatedAt))
      .limit(input.limit);

    return { items: rows };
  }),

  get: protectedProcedure.input(formIdSchema).query(async ({ ctx, input }) => {
    const form = await ctx.db.query.forms.findFirst({
      where: and(eq(schema.forms.id, input.id), eq(schema.forms.userId, ctx.user.id)),
      with: {
        fields: { orderBy: (f, { asc }) => [asc(f.order)] },
        theme: true,
      },
    });
    if (!form) throw new TRPCError({ code: "NOT_FOUND" });
    return form;
  }),

  create: protectedProcedure.input(createFormSchema).mutation(async ({ ctx, input }) => {
    const slug = input.slug ?? makeAutoSlug(input.title);
    const existing = await ctx.db.query.forms.findFirst({
      where: eq(schema.forms.slug, slug),
      columns: { id: true },
    });
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Slug already taken" });

    const [form] = await ctx.db
      .insert(schema.forms)
      .values({
        slug,
        userId: ctx.user.id,
        themeId: input.themeId,
        type: "hosted",
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        settings: HOSTED_DEFAULT_SETTINGS,
      })
      .returning();
    if (!form) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return form;
  }),

  update: protectedProcedure.input(updateFormSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.id, ctx.user.id);

    const patch: Partial<typeof schema.forms.$inferInsert> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.coverImage !== undefined) patch.coverImage = input.coverImage;
    if (input.themeId !== undefined) patch.themeId = input.themeId;
    if (input.visibility !== undefined) patch.visibility = input.visibility;
    if (input.maxResponses !== undefined) patch.maxResponses = input.maxResponses;
    if (input.expiresAt !== undefined) {
      patch.expiresAt =
        input.expiresAt === null
          ? null
          : input.expiresAt instanceof Date
            ? input.expiresAt
            : new Date(input.expiresAt);
    }
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.status !== undefined) {
      patch.status = input.status;
      if (input.status === "published") patch.publishedAt = new Date();
    }
    if (input.settings !== undefined) {
      const current = await ctx.db.query.forms.findFirst({
        where: eq(schema.forms.id, input.id),
        columns: { settings: true },
      });
      patch.settings = { ...(current?.settings ?? HOSTED_DEFAULT_SETTINGS), ...input.settings };
    }

    const [updated] = await ctx.db
      .update(schema.forms)
      .set(patch)
      .where(eq(schema.forms.id, input.id))
      .returning();
    return updated;
  }),

  delete: protectedProcedure.input(formIdSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.id, ctx.user.id);
    await ctx.db.delete(schema.forms).where(eq(schema.forms.id, input.id));
    return { ok: true };
  }),

  publish: protectedProcedure.input(formIdSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.id, ctx.user.id);
    const [updated] = await ctx.db
      .update(schema.forms)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(schema.forms.id, input.id))
      .returning();
    return updated;
  }),

  unpublish: protectedProcedure.input(formIdSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.id, ctx.user.id);
    const [updated] = await ctx.db
      .update(schema.forms)
      .set({ status: "draft" })
      .where(eq(schema.forms.id, input.id))
      .returning();
    return updated;
  }),

  duplicate: protectedProcedure.input(formIdSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.id, ctx.user.id);
    const source = await ctx.db.query.forms.findFirst({
      where: eq(schema.forms.id, input.id),
      with: { fields: true },
    });
    if (!source) throw new TRPCError({ code: "NOT_FOUND" });

    return ctx.db.transaction(async (tx) => {
      const [copy] = await tx
        .insert(schema.forms)
        .values({
          slug: makeAutoSlug(source.title + " copy"),
          userId: source.userId,
          themeId: source.themeId,
          type: source.type,
          title: source.title + " (copy)",
          description: source.description,
          coverImage: source.coverImage,
          status: "draft",
          visibility: source.visibility,
          settings: source.settings,
          maxResponses: source.maxResponses,
          expiresAt: source.expiresAt,
        })
        .returning();
      if (!copy) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (source.fields.length > 0) {
        await tx.insert(schema.fields).values(
          source.fields.map((f) => ({
            formId: copy.id,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder,
            helpText: f.helpText,
            required: f.required,
            order: f.order,
            config: f.config,
            conditionalLogic: f.conditionalLogic,
          })),
        );
      }
      return copy;
    });
  }),

  setPassword: protectedProcedure.input(setPasswordSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.formId, ctx.user.id);
    const current = await ctx.db.query.forms.findFirst({
      where: eq(schema.forms.id, input.formId),
      columns: { settings: true },
    });
    if (!current) throw new TRPCError({ code: "NOT_FOUND" });

    const passwordHash =
      input.password === null ? null : await bcrypt.hash(input.password, 12);
    await ctx.db
      .update(schema.forms)
      .set({ settings: { ...current.settings, passwordHash } })
      .where(eq(schema.forms.id, input.formId));
    return { ok: true, hasPassword: passwordHash !== null };
  }),

  getAnalytics: protectedProcedure.input(formIdSchema).query(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.id, ctx.user.id);

    // Aggregate counts per event type
    const eventCountsRows = await ctx.db
      .select({
        event: schema.analyticsEvents.event,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.analyticsEvents)
      .where(eq(schema.analyticsEvents.formId, input.id))
      .groupBy(schema.analyticsEvents.event);

    const eventCounts: Record<string, number> = {
      view: 0,
      start: 0,
      submit: 0,
      abandon: 0,
    };
    for (const r of eventCountsRows) eventCounts[r.event] = r.count;

    // Last 30 days of submissions, bucketed by day
    const dailyRows = await ctx.db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${schema.responses.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.responses)
      .where(
        and(
          eq(schema.responses.formId, input.id),
          sql`${schema.responses.createdAt} > now() - interval '30 days'`,
        ),
      )
      .groupBy(sql`date_trunc('day', ${schema.responses.createdAt})`)
      .orderBy(sql`date_trunc('day', ${schema.responses.createdAt})`);

    // Avg completion time
    const [completion] = await ctx.db
      .select({
        avg: sql<number>`coalesce(avg(${schema.responses.completionTime}), 0)::int`,
      })
      .from(schema.responses)
      .where(eq(schema.responses.formId, input.id));

    // Top drop-off field
    const [topDropoff] = await ctx.db
      .select({
        fieldId: sql<string>`(${schema.analyticsEvents.metadata} ->> 'fieldId')`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.analyticsEvents)
      .where(
        and(
          eq(schema.analyticsEvents.formId, input.id),
          eq(schema.analyticsEvents.event, "abandon"),
        ),
      )
      .groupBy(sql`(${schema.analyticsEvents.metadata} ->> 'fieldId')`)
      .orderBy(sql`count(*) desc`)
      .limit(1);

    const submits = eventCounts.submit ?? 0;
    const starts = eventCounts.start ?? 0;
    const completionRate = starts > 0 ? Math.round((submits / starts) * 1000) / 10 : 0;

    return {
      eventCounts,
      completionRate,
      avgCompletionMs: completion?.avg ?? 0,
      topDropoffFieldId: topDropoff?.fieldId ?? null,
      daily: dailyRows,
    };
  }),

  fieldDistribution: protectedProcedure
    .input(z.object({ formId: z.string().uuid(), fieldId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertFormOwner(ctx.db, input.formId, ctx.user.id);
      const rows = await ctx.db
        .select({
          value: sql<string>`${schema.responseValues.value}::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.responseValues)
        .where(eq(schema.responseValues.fieldId, input.fieldId))
        .groupBy(sql`${schema.responseValues.value}::text`)
        .orderBy(sql`count(*) desc`)
        .limit(20);
      return rows;
    }),
});

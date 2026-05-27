import { and, desc, eq, ilike, or, schema, sql } from "@repo/database";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";

const formStatusSchema = z.enum(["draft", "published", "archived"]);
const formVisibilitySchema = z.enum(["public", "unlisted"]);

export const adminRouter = router({
  /**
   * Platform-wide stats: aggregate counts plus recent signups and top forms.
   * Uses a handful of efficient aggregate queries rather than per-row counts.
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      [userCount],
      formStatusRows,
      formVisibilityRows,
      [responseCount],
      [themeCount],
      [analyticsCount],
      recentSignups,
      topForms,
    ] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(schema.users),
      ctx.db
        .select({
          status: schema.forms.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.forms)
        .groupBy(schema.forms.status),
      ctx.db
        .select({
          visibility: schema.forms.visibility,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.forms)
        .groupBy(schema.forms.visibility),
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(schema.responses),
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(schema.themes),
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(schema.analyticsEvents),
      ctx.db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .orderBy(desc(schema.users.createdAt))
        .limit(5),
      ctx.db
        .select({
          id: schema.forms.id,
          title: schema.forms.title,
          slug: schema.forms.slug,
          responseCount: schema.forms.responseCount,
          ownerEmail: schema.users.email,
        })
        .from(schema.forms)
        .innerJoin(schema.users, eq(schema.forms.userId, schema.users.id))
        .orderBy(desc(schema.forms.responseCount))
        .limit(5),
    ]);

    const formsByStatus = { draft: 0, published: 0, archived: 0 };
    for (const r of formStatusRows) formsByStatus[r.status] = r.count;

    const formsByVisibility = { public: 0, unlisted: 0 };
    for (const r of formVisibilityRows) formsByVisibility[r.visibility] = r.count;

    const totalForms =
      formsByStatus.draft + formsByStatus.published + formsByStatus.archived;

    return {
      totalUsers: userCount?.count ?? 0,
      totalForms,
      formsByStatus,
      formsByVisibility,
      totalResponses: responseCount?.count ?? 0,
      totalThemes: themeCount?.count ?? 0,
      totalAnalyticsEvents: analyticsCount?.count ?? 0,
      recentSignups,
      topForms,
    };
  }),

  /**
   * List ALL forms across ALL users (admin bypasses ownership). Supports
   * title/slug search and status/visibility filters, ordered by createdAt desc,
   * paginated.
   */
  listForms: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: formStatusSchema.optional(),
        visibility: formVisibilitySchema.optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        input.status ? eq(schema.forms.status, input.status) : undefined,
        input.visibility ? eq(schema.forms.visibility, input.visibility) : undefined,
        input.search
          ? or(
              ilike(schema.forms.title, `%${input.search}%`),
              ilike(schema.forms.slug, `%${input.search}%`),
            )
          : undefined,
      );

      const offset = (input.page - 1) * input.pageSize;

      const [items, [totalRow]] = await Promise.all([
        ctx.db
          .select({
            id: schema.forms.id,
            title: schema.forms.title,
            slug: schema.forms.slug,
            status: schema.forms.status,
            visibility: schema.forms.visibility,
            responseCount: schema.forms.responseCount,
            viewCount: schema.forms.viewCount,
            themeId: schema.forms.themeId,
            createdAt: schema.forms.createdAt,
            ownerEmail: schema.users.email,
            ownerName: schema.users.name,
          })
          .from(schema.forms)
          .innerJoin(schema.users, eq(schema.forms.userId, schema.users.id))
          .where(where)
          .orderBy(desc(schema.forms.createdAt))
          .limit(input.pageSize)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.forms)
          .where(where),
      ]);

      return {
        items,
        total: totalRow?.count ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * List ALL users with their form counts. Supports email/name search,
   * paginated.
   */
  listUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.search
        ? or(
            ilike(schema.users.email, `%${input.search}%`),
            ilike(schema.users.name, `%${input.search}%`),
          )
        : undefined;

      const offset = (input.page - 1) * input.pageSize;

      const [items, [totalRow]] = await Promise.all([
        ctx.db
          .select({
            id: schema.users.id,
            email: schema.users.email,
            name: schema.users.name,
            role: schema.users.role,
            emailVerified: schema.users.emailVerified,
            createdAt: schema.users.createdAt,
            formCount: sql<number>`count(${schema.forms.id})::int`,
          })
          .from(schema.users)
          .leftJoin(schema.forms, eq(schema.forms.userId, schema.users.id))
          .where(where)
          .groupBy(schema.users.id)
          .orderBy(desc(schema.users.createdAt))
          .limit(input.pageSize)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.users)
          .where(where),
      ]);

      return {
        items,
        total: totalRow?.count ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /** Update any form's status (admin moderation, bypasses ownership). */
  setFormStatus: adminProcedure
    .input(z.object({ formId: z.string().uuid(), status: formStatusSchema }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(schema.forms)
        .set({
          status: input.status,
          ...(input.status === "published" ? { publishedAt: new Date() } : {}),
        })
        .where(eq(schema.forms.id, input.formId))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      return updated;
    }),

  /** Update any form's visibility (admin moderation, bypasses ownership). */
  setFormVisibility: adminProcedure
    .input(z.object({ formId: z.string().uuid(), visibility: formVisibilitySchema }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(schema.forms)
        .set({ visibility: input.visibility })
        .where(eq(schema.forms.id, input.formId))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      return updated;
    }),

  /** Delete any form (cascades to fields/responses/analytics via FK). */
  deleteForm: adminProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(schema.forms)
        .where(eq(schema.forms.id, input.formId))
        .returning({ id: schema.forms.id });
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      return { ok: true, id: deleted.id };
    }),

  /**
   * Promote/demote a user. An admin cannot demote themselves: guarded against
   * the authenticated user's id.
   */
  setUserRole: adminProcedure
    .input(z.object({ userId: z.string().uuid(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote yourself",
        });
      }
      const [updated] = await ctx.db
        .update(schema.users)
        .set({ role: input.role })
        .where(eq(schema.users.id, input.userId))
        .returning({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
          role: schema.users.role,
        });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return updated;
    }),
});

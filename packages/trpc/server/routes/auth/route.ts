import { eq, schema } from "@repo/database";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, publicProcedure, router } from "../../trpc";

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    // Better Auth may not surface the custom `role` column on `ctx.user`, so
    // read it directly from the DB.
    const row = await ctx.db.query.users.findFirst({
      where: eq(schema.users.id, ctx.user.id),
      columns: { role: true },
    });
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      avatarUrl: ctx.user.avatarUrl,
      emailVerified: ctx.user.emailVerified,
      role: row?.role ?? "user",
    };
  }),

  /**
   * Better Auth owns the actual register/login/logout flows via its HTTP routes
   * mounted at /auth/*. We expose them via the dedicated mount in the app so the
   * client can call them directly — no need to proxy through tRPC.
   *
   * This endpoint just confirms the auth surface is up.
   */
  status: publicProcedure.query(({ ctx }) => {
    return {
      authenticated: !!ctx.user,
      userId: ctx.user?.id ?? null,
    };
  }),

  // Server-side guard used by middleware on protected pages
  requireAuth: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return { ok: true };
  }),
});

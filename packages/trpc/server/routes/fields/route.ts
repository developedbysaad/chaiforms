import { and, asc, eq, inArray, schema } from "@repo/database";
import { assertFieldOwner, assertFormOwner } from "@repo/services";
import {
  createFieldSchema,
  fieldIdSchema,
  reorderFieldsSchema,
  updateFieldSchema,
} from "@repo/services/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const fieldsRouter = router({
  list: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertFormOwner(ctx.db, input.formId, ctx.user.id);
      return ctx.db
        .select()
        .from(schema.fields)
        .where(eq(schema.fields.formId, input.formId))
        .orderBy(asc(schema.fields.order));
    }),

  create: protectedProcedure.input(createFieldSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.formId, ctx.user.id);
    const [created] = await ctx.db
      .insert(schema.fields)
      .values({
        formId: input.formId,
        type: input.type,
        label: input.label,
        placeholder: input.placeholder ?? null,
        helpText: input.helpText ?? null,
        required: input.required,
        order: input.order,
        config: input.config,
        conditionalLogic: input.conditionalLogic ?? null,
      })
      .returning();
    if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return created;
  }),

  update: protectedProcedure.input(updateFieldSchema).mutation(async ({ ctx, input }) => {
    await assertFieldOwner(ctx.db, input.id, ctx.user.id);
    const patch: Partial<typeof schema.fields.$inferInsert> = {};
    if (input.label !== undefined) patch.label = input.label;
    if (input.placeholder !== undefined) patch.placeholder = input.placeholder;
    if (input.helpText !== undefined) patch.helpText = input.helpText;
    if (input.required !== undefined) patch.required = input.required;
    if (input.order !== undefined) patch.order = input.order;
    if (input.config !== undefined) patch.config = input.config;
    if (input.conditionalLogic !== undefined) patch.conditionalLogic = input.conditionalLogic;

    const [updated] = await ctx.db
      .update(schema.fields)
      .set(patch)
      .where(eq(schema.fields.id, input.id))
      .returning();
    return updated;
  }),

  delete: protectedProcedure.input(fieldIdSchema).mutation(async ({ ctx, input }) => {
    await assertFieldOwner(ctx.db, input.id, ctx.user.id);
    await ctx.db.delete(schema.fields).where(eq(schema.fields.id, input.id));
    return { ok: true };
  }),

  reorder: protectedProcedure.input(reorderFieldsSchema).mutation(async ({ ctx, input }) => {
    await assertFormOwner(ctx.db, input.formId, ctx.user.id);
    // Verify all field IDs belong to this form
    const ids = input.fields.map((f) => f.id);
    const owned = await ctx.db
      .select({ id: schema.fields.id })
      .from(schema.fields)
      .where(and(eq(schema.fields.formId, input.formId), inArray(schema.fields.id, ids)));
    if (owned.length !== ids.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Some fields do not belong to the form" });
    }

    await ctx.db.transaction(async (tx) => {
      for (const { id, order } of input.fields) {
        await tx.update(schema.fields).set({ order }).where(eq(schema.fields.id, id));
      }
    });
    return { ok: true };
  }),
});

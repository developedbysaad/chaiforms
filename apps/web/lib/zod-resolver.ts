import { zodResolver as zodResolverBase } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";

/**
 * Type bridge for `zodResolver`.
 *
 * zod 3.25 ships BOTH the classic v3 API and the new v4 type core. Our schemas
 * (`@repo/services`) use the v3 classic API (`ZodObject<…, "strip", …>`), but
 * `@hookform/resolvers@3.10` types `zodResolver`'s argument against the v4
 * `ZodType` — a shape that a transitive `zod@4` in the tree (pulled by
 * better-auth/astro) surfaces. The two are **runtime-compatible**; this keeps a
 * single, documented cast in one place instead of `as never` at every call site.
 *
 * Swap back to importing directly from `@hookform/resolvers/zod` once the
 * workspace is on a single zod major.
 */
export function zodResolver<T extends FieldValues>(schema: unknown): Resolver<T> {
  return (zodResolverBase as unknown as (s: unknown) => Resolver<T>)(schema);
}

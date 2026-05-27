import { z } from "zod";

export const fieldTypeSchema = z.enum([
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "rating",
  "date",
  "phone",
  "url",
  // Wave 2 — richer field types
  "linear_scale",
  "ranking",
  "address",
  "time",
  "signature",
  // File upload backed by Cloudflare R2 (presigned uploads). Only usable when
  // R2 storage is configured — the builder hides/disables it otherwise.
  "file_upload",
  // Layout marker: splits the form into pages. Carries no answer value.
  "page_break",
]);
export type FieldTypeInput = z.infer<typeof fieldTypeSchema>;

export const ratingStyleSchema = z.enum(["star", "number", "emoji"]);

export const selectOptionSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
  // Quiz/scoring mode: points awarded when this option is chosen.
  score: z.number().optional(),
});

export const fieldConfigSchema = z
  .object({
    options: z.array(selectOptionSchema).max(50).optional(),
    maxRating: z.number().int().min(1).max(10).optional(),
    ratingStyle: ratingStyleSchema.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().positive().optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    includeTime: z.boolean().optional(),
    // linear_scale
    scaleMin: z.number().int().optional(),
    scaleMax: z.number().int().optional(),
    scaleMinLabel: z.string().max(60).optional(),
    scaleMaxLabel: z.string().max(60).optional(),
    // Hidden fields are never rendered; their value comes from a URL query
    // param (prefillKey, falling back to the field id). Useful for tracking.
    hidden: z.boolean().optional(),
    prefillKey: z.string().max(60).optional(),
    // file_upload — max allowed size (MB) and accepted mime/extension hints
    // (e.g. ["image/png", ".pdf"]). Both optional; absence means "no limit"
    // beyond the global default cap and "accept anything".
    maxSizeMb: z.number().positive().max(100).optional(),
    acceptedTypes: z.array(z.string().max(120)).max(50).optional(),
  })
  .strict();
export type FieldConfigInput = z.infer<typeof fieldConfigSchema>;

export const conditionalOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "is_filled",
  "is_empty",
]);

export const conditionalRuleSchema = z.object({
  fieldId: z.string().uuid(),
  operator: conditionalOperatorSchema,
  value: z.unknown().optional(),
});

export const conditionalLogicSchema = z.object({
  showIf: z.array(conditionalRuleSchema).min(1).max(10),
});
export type ConditionalLogicInput = z.infer<typeof conditionalLogicSchema>;

export const createFieldSchema = z.object({
  formId: z.string().uuid(),
  type: fieldTypeSchema,
  label: z.string().trim().min(1, "Label is required").max(200),
  placeholder: z.string().max(200).nullish(),
  helpText: z.string().max(500).nullish(),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
  config: fieldConfigSchema.default({}),
  conditionalLogic: conditionalLogicSchema.nullish(),
});
export type CreateFieldInput = z.infer<typeof createFieldSchema>;

export const updateFieldSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(200).optional(),
  placeholder: z.string().max(200).nullable().optional(),
  helpText: z.string().max(500).nullable().optional(),
  required: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  config: fieldConfigSchema.optional(),
  conditionalLogic: conditionalLogicSchema.nullable().optional(),
});
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

export const reorderFieldsSchema = z.object({
  formId: z.string().uuid(),
  fields: z.array(z.object({ id: z.string().uuid(), order: z.number().int().min(0) })).min(1),
});
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;

export const fieldIdSchema = z.object({ id: z.string().uuid() });

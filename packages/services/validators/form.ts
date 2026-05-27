import { z } from "zod";

export const formStatusSchema = z.enum(["draft", "published", "archived"]);
export type FormStatusInput = z.infer<typeof formStatusSchema>;

export const formVisibilitySchema = z.enum(["public", "unlisted"]);
export type FormVisibilityInput = z.infer<typeof formVisibilitySchema>;

export const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters")
  .max(64, "Slug must be at most 64 characters")
  .regex(slugRegex, "Use only lowercase letters, numbers, and hyphens");

export const scoringOutcomeSchema = z.object({
  min: z.number(),
  max: z.number(),
  title: z.string().max(200),
  message: z.string().max(2000),
});

export const scoringSchema = z.object({
  enabled: z.boolean(),
  outcomes: z.array(scoringOutcomeSchema).max(20),
});
export type ScoringInput = z.infer<typeof scoringSchema>;

export const formLayoutSchema = z.enum(["classic", "one_per_page"]);

export const formSettingsSchema = z.object({
  allowMultipleSubmissions: z.boolean(),
  requireEmail: z.boolean(),
  sendConfirmationEmail: z.boolean(),
  notifyCreator: z.boolean(),
  successMessage: z.string().trim().max(500),
  // Empty/whitespace → null so the field can be cleared and partial typing in the
  // builder (saved on blur) never trips URL validation. Trimmed, then URL-checked.
  redirectUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
    z.string().url("Enter a full URL like https://example.com").nullable(),
  ),
  // Hash is server-set; on the API surface we accept plaintext via setPasswordSchema below.
  passwordHash: z.string().nullable(),
  // Wave 2 — optional so forms created before these existed still parse.
  layout: formLayoutSchema.optional(),
  showProgressBar: z.boolean().optional(),
  confirmationEmailMessage: z.string().max(2000).optional(),
  scoring: scoringSchema.optional(),
});
export type FormSettingsInput = z.infer<typeof formSettingsSchema>;

export const updateFormSettingsSchema = formSettingsSchema
  .omit({ passwordHash: true })
  .partial();
export type UpdateFormSettingsInput = z.infer<typeof updateFormSettingsSchema>;

export const setPasswordSchema = z.object({
  formId: z.string().uuid(),
  password: z.string().min(4).max(120).nullable(),
});

export const createFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  themeId: z.string().uuid(),
  visibility: formVisibilitySchema.default("unlisted"),
  slug: slugSchema.optional(),
});
export type CreateFormInput = z.infer<typeof createFormSchema>;

export const updateFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  themeId: z.string().uuid().optional(),
  status: formStatusSchema.optional(),
  visibility: formVisibilitySchema.optional(),
  settings: updateFormSettingsSchema.optional(),
  maxResponses: z.number().int().positive().nullable().optional(),
  expiresAt: z
    .union([z.string().datetime(), z.date()])
    .nullable()
    .optional(),
  slug: slugSchema.optional(),
});
export type UpdateFormInput = z.infer<typeof updateFormSchema>;

export const listFormsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(120).optional(),
  status: formStatusSchema.optional(),
});
export type ListFormsInput = z.infer<typeof listFormsSchema>;

export const listPublicFormsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(24),
  search: z.string().max(120).optional(),
  category: z.string().max(60).optional(),
});
export type ListPublicFormsInput = z.infer<typeof listPublicFormsSchema>;

export const formIdSchema = z.object({ id: z.string().uuid() });
export const formSlugSchema = z.object({ slug: slugSchema });

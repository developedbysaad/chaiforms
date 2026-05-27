import { z } from "zod";

/**
 * Validators for AI form generation. Users bring their own Anthropic API key;
 * the model returns a form draft which we validate against these schemas before
 * persisting. The field-type subset excludes layout/markers and types that need
 * bespoke config the model can't reliably produce (signature, page_break, etc.).
 */

export const aiFieldTypeSchema = z.enum([
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
  "linear_scale",
]);
export type AiFieldType = z.infer<typeof aiFieldTypeSchema>;

export const aiGeneratedOptionSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
});

export const aiGeneratedFieldSchema = z.object({
  type: aiFieldTypeSchema,
  label: z.string().trim().min(1).max(200),
  required: z.boolean().default(false),
  placeholder: z.string().max(200).nullish(),
  helpText: z.string().max(500).nullish(),
  // Only meaningful for single_select / multi_select.
  options: z.array(aiGeneratedOptionSchema).max(50).optional(),
});
export type AiGeneratedField = z.infer<typeof aiGeneratedFieldSchema>;

export const aiGeneratedFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  fields: z.array(aiGeneratedFieldSchema).min(1).max(25),
});
export type AiGeneratedForm = z.infer<typeof aiGeneratedFormSchema>;

/** Anthropic keys look like `sk-ant-...`. We only do a shape check; validity is confirmed by a live auth probe. */
export const setAiKeySchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "That doesn't look like an Anthropic API key")
    .max(200)
    .regex(/^sk-ant-/, "Anthropic keys start with “sk-ant-”"),
});
export type SetAiKeyInput = z.infer<typeof setAiKeySchema>;

export const generateFormSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, "Describe the form you want")
    .max(1000, "Keep the description under 1000 characters"),
  themeId: z.string().uuid(),
});
export type GenerateFormInput = z.infer<typeof generateFormSchema>;

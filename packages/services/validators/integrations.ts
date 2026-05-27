import { z } from "zod";

/** The set of integration keys the platform knows about. */
export const integrationKeySchema = z.enum(["discord", "sheets"]);
export type IntegrationKey = z.infer<typeof integrationKeySchema>;

/** Admin toggle: flip a platform-wide integration flag on/off. */
export const adminSetIntegrationEnabledSchema = z.object({
  key: integrationKeySchema,
  enabled: z.boolean(),
});
export type AdminSetIntegrationEnabledInput = z.infer<
  typeof adminSetIntegrationEnabledSchema
>;

/** Per-form Discord config — a single https webhook URL. */
export const discordIntegrationConfigSchema = z.object({
  webhookUrl: z
    .string()
    .trim()
    .url("Enter a valid Discord webhook URL")
    .refine((u) => u.startsWith("https://"), "Webhook URL must be https"),
});
export type DiscordIntegrationConfigInput = z.infer<
  typeof discordIntegrationConfigSchema
>;

/** Per-form Google Sheets config — spreadsheet id + target sheet/tab name. */
export const sheetsIntegrationConfigSchema = z.object({
  spreadsheetId: z.string().trim().min(1, "Spreadsheet ID is required").max(200),
  sheetName: z.string().trim().min(1, "Sheet name is required").max(120),
});
export type SheetsIntegrationConfigInput = z.infer<
  typeof sheetsIntegrationConfigSchema
>;

/** Upsert a per-form integration. The `config` shape is validated by `type`. */
export const upsertFormIntegrationSchema = z.discriminatedUnion("type", [
  z.object({
    formId: z.string().uuid(),
    type: z.literal("discord"),
    config: discordIntegrationConfigSchema,
    enabled: z.boolean().optional(),
  }),
  z.object({
    formId: z.string().uuid(),
    type: z.literal("sheets"),
    config: sheetsIntegrationConfigSchema,
    enabled: z.boolean().optional(),
  }),
]);
export type UpsertFormIntegrationInput = z.infer<typeof upsertFormIntegrationSchema>;

export const formIntegrationIdSchema = z.object({
  formId: z.string().uuid(),
  type: integrationKeySchema,
});

export const listFormIntegrationsSchema = z.object({
  formId: z.string().uuid(),
});

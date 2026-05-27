import { z } from "zod";

export const captchaProviderSchema = z.enum(["none", "hcaptcha", "recaptcha", "turnstile"]);

export const createEndpointFormSchema = z.object({
  title: z.string().trim().min(1, "Form name is required").max(120),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a valid website URL"),
  recipientEmail: z.string().trim().toLowerCase().email().optional(),
});
export type CreateEndpointFormInput = z.infer<typeof createEndpointFormSchema>;

export const updateEndpointFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(120).optional(),
  recipientEmail: z.string().trim().toLowerCase().email().optional(),
  allowedOrigins: z.array(z.string().min(1).max(200)).max(20).optional(),
  endpointSettings: z
    .object({
      honeypotEnabled: z.boolean().optional(),
      captchaProvider: captchaProviderSchema.optional(),
      captchaSiteKey: z.string().max(200).nullable().optional(),
      // Plain secret on input — server encrypts before storage.
      captchaSecret: z.string().max(200).nullable().optional(),
      subjectTemplate: z.string().max(200).optional(),
      notifyEmails: z.array(z.string().email()).max(10).optional(),
      redirectUrl: z.string().url().nullable().optional(),
      webhookUrl: z.string().url().nullable().optional(),
      allowServerSide: z.boolean().optional(),
    })
    .optional(),
});
export type UpdateEndpointFormInput = z.infer<typeof updateEndpointFormSchema>;

export const endpointIdSchema = z.object({ id: z.string().uuid() });

export const rotateKeySchema = z.object({ id: z.string().uuid() });

export const listEndpointFormsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(120).optional(),
});

export const verifyAccessKeySchema = z.object({
  token: z.string().min(1).max(200),
});

import { z } from "zod";

export const themeBorderRadiusSchema = z.enum(["none", "sm", "md", "lg", "full"]);

export const themeConfigSchema = z.object({
  background: z.string(),
  surface: z.string(),
  surfaceAlt: z.string(),
  text: z.string(),
  textMuted: z.string(),
  accent: z.string(),
  accentText: z.string(),
  border: z.string(),
  error: z.string(),
  fontFamily: z.string(),
  fontUrl: z.string(),
  headingWeight: z.number().int().min(100).max(900),
  borderRadius: themeBorderRadiusSchema,
  pattern: z.string().optional(),
  logoEmoji: z.string().optional(),
});
export type ThemeConfigInput = z.infer<typeof themeConfigSchema>;

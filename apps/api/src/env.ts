import { z } from "zod";

/**
 * Env for the standalone API app. Mirrors the starter's style.
 *
 * Only the values this app reads directly are validated here. Other secrets
 * (DATABASE_URL, BETTER_AUTH_*, UPSTASH_*, RESEND_*, etc.) are validated by the
 * `@repo/*` packages themselves on import, so they aren't duplicated here.
 */
const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  // Google OAuth for the Sheets integration callback. OPTIONAL — absence means
  // the Google callback route reports the integration as unconfigured.
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);

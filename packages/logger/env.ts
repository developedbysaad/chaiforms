import { z } from "zod";

const envSchema = z.object({
  // Standard Node envs; "prod" kept as an alias for the starter convention.
  NODE_ENV: z.enum(["development", "production", "prod", "test"]).default("development"),
  LOGGER_LEVEL: z.enum(["error", "debug", "info"]).optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);

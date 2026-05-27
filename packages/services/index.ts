/**
 * Server-only barrel for @repo/services.
 *
 * Pulls in server/runtime deps (resend, upstash, pg via @repo/database). The
 * browser must NOT import this — it should import the pure-Zod schemas from
 * `@repo/services/validators` directly so it never bundles server-only code.
 *
 * The env module is exported from `@repo/services/env`; lib modules are also
 * reachable individually via `@repo/services/lib/*`.
 */

export * from "./email";

export * from "./lib/crypto";
export * from "./lib/captcha";
export * from "./lib/ip";
export * from "./lib/slug";
export * from "./lib/ratelimit";
export * from "./lib/origin";
export * from "./lib/ownership";
export * from "./lib/export-data";
export * from "./lib/storage";
export * from "./lib/integrations";

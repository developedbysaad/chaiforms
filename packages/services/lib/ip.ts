import { createHash } from "node:crypto";

import { env } from "../env";

/**
 * Minimal request shape getClientIp needs — a header accessor. Satisfied by
 * both Hono's `HonoRequest` (from `app.fetch`) and the normalized tRPC
 * context req (`{ header(name) }`), so callers don't have to agree on a type.
 */
type HeaderReadable = { header(name: string): string | undefined };

/**
 * Best-effort client IP from common proxy headers. Falls back to "unknown"
 * so rate limit keys are still stable (just shared across "unknown" callers).
 */
export function getClientIp(req: HeaderReadable): string {
  const forwardedFor = req.header("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.header("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = req.header("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

/**
 * Hash an IP with a salt before persisting. Never store raw IPs.
 */
export function hashIp(ip: string): string {
  const salt = env.BETTER_AUTH_SECRET;
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

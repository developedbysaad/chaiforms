import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "../clients/redis";
import { env } from "../env";

/**
 * If Upstash isn't configured, return a permissive limiter so dev still works.
 * In prod we expect the env vars to be set — if they aren't, log loudly.
 */
function makeLimiter(rate: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!redis) {
    if (env.NODE_ENV === "production") {
      console.warn(
        "⚠️ Upstash not configured in production — rate limiting is disabled.",
      );
    }
    return {
      limit: async () => ({
        success: true,
        limit: rate,
        remaining: rate,
        reset: Date.now() + 60_000,
      }),
    };
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rate, window),
    analytics: false,
    prefix: "chaiform",
  });
}

// 5 submissions per form per IP per hour.
export const submitLimiter = makeLimiter(5, "1 h");

// 60 events per IP per minute — track endpoints are chatty but bounded.
export const eventLimiter = makeLimiter(60, "1 m");

// 10 login attempts per IP per 5 minutes.
export const authLimiter = makeLimiter(10, "5 m");

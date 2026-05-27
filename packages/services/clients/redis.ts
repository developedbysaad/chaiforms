import { Redis } from "@upstash/redis";

import { env } from "../env";

/**
 * Shared Upstash Redis client. `null` when Upstash isn't configured (dev),
 * which callers (e.g. lib/ratelimit.ts) treat as a graceful no-op.
 */
export const redis: Redis | null =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

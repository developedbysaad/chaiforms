import { db, schema } from "@repo/database";

import { auth } from "./auth";

type SessionRow = typeof schema.sessions.$inferSelect;
type UserRow = typeof schema.users.$inferSelect;

/**
 * Minimal Express request shape we rely on. Both
 * `@trpc/server/adapters/express` (CreateExpressContextOptions) and
 * trpc-to-openapi's express middleware hand us a real Express `req`/`res`,
 * which satisfy this. We keep it structural so the package doesn't have to
 * depend on `@types/express`.
 *
 * `header(name)` is provided by Express and is what router code uses (via
 * `getClientIp(ctx.req)`).
 */
export interface ExpressLikeRequest {
  headers: Record<string, string | string[] | undefined>;
  header(name: string): string | undefined;
}

export interface CreateContextOptions {
  req: ExpressLikeRequest;
  res: unknown;
}

/** Build a Web `Headers` object from Express-style `req.headers`. */
function toHeaders(reqHeaders: Record<string, string | string[] | undefined>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(reqHeaders)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }
  return headers;
}

export async function createContext({ req }: CreateContextOptions) {
  const headers = toHeaders(req.headers);
  const session = await auth.api.getSession({ headers }).catch(() => null);

  return {
    db,
    req,
    headers,
    session: (session?.session ?? null) as SessionRow | null,
    user: (session?.user ?? null) as UserRow | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

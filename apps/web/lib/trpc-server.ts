import "server-only";

import { createTRPCProxyClient, httpBatchLink, type ServerRouter } from "@repo/trpc/client";
import { headers } from "next/headers";
import superjson from "superjson";

/**
 * Server-to-server base URL for the standalone API. In the single-container
 * deploy the api runs on localhost:8000.
 */
const serverUrl =
  (process.env.API_INTERNAL_URL ?? "http://localhost:8000") + "/trpc";

/**
 * Server-side tRPC HTTP proxy client. Use in Server Components to call
 * procedures over HTTP against the standalone API. Forwards the incoming
 * request's cookie header so session-aware RSC calls authenticate.
 *
 * NOTE: proxy-client calls use `.query(input)` / `.mutate(input)`
 * (e.g. `api.public.getForm.query({ slug })`).
 */
export const api = createTRPCProxyClient<ServerRouter>({
  links: [
    httpBatchLink({
      url: serverUrl,
      transformer: superjson,
      headers() {
        const cookie = headers().get("cookie");
        return cookie ? { cookie } : {};
      },
    }),
  ],
});

/**
 * Backward-compat shim: returns the singleton proxy client.
 */
export async function getServerCaller() {
  return api;
}

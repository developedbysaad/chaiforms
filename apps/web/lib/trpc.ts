import type { ServerRouter } from "@repo/trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<ServerRouter>();

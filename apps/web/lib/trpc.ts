import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@shifahub/trpc";

/** End-to-end type-safe tRPC React hooks. AppRouter is a TYPE-only import. */
export const trpc = createTRPCReact<AppRouter>();

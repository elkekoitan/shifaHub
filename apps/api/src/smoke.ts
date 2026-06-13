import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@shifahub/trpc";

/**
 * P1 interop proof: a fully type-safe tRPC client calling the running server
 * over HTTP. Exercises the whole chain web-equivalent -> trpc -> fastify -> db.
 */
const url = process.env.SMOKE_URL ?? "http://localhost:4000/trpc";

const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url, transformer: superjson })],
});

async function main() {
  const res = await client.health.check.query();
  console.log("[smoke] health.check ->", res);
  if (!res.ok) {
    throw new Error("health.check returned ok=false");
  }
  console.log("[smoke] PASS");
}

main().catch((err) => {
  console.error("[smoke] FAIL", err);
  process.exit(1);
});

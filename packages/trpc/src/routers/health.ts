import { sql } from "@shifahub/db";
import { publicProcedure, router } from "../trpc";

/**
 * Liveness + DB connectivity. Used by the P1 interop smoke test and by the
 * Coolify deploy smoke check. Never throws on DB failure — reports it instead.
 */
export const healthRouter = router({
  check: publicProcedure.query(async () => {
    let dbOk: boolean;
    try {
      const rows = await sql<{ ok: number }[]>`select 1 as ok`;
      dbOk = rows[0]?.ok === 1;
    } catch {
      dbOk = false;
    }
    return { ok: true, db: dbOk, ts: new Date().toISOString() };
  }),
});

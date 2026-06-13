import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";

/**
 * The application's single root router. Remaining domain routers (danisan,
 * egitmen, randevu, tedavi, tahlil, stok, odeme, bildirim, mesaj, protokol,
 * musaitlik, komplikasyon, acil, admin, kvkk) are merged here as they land.
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

import { router } from "./trpc";
import { healthRouter } from "./routers/health";

/**
 * The application's single root router. Domain routers (auth, danisan, egitmen,
 * randevu, tedavi, tahlil, stok, odeme, bildirim, mesaj, protokol, musaitlik,
 * komplikasyon, acil, admin, kvkk) are merged here in P3.
 */
export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;

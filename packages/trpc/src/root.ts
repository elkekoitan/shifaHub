import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { danisanRouter } from "./routers/danisan";
import { egitmenRouter } from "./routers/egitmen";
import { randevuRouter } from "./routers/randevu";
import { tedaviRouter } from "./routers/tedavi";
import { tahlilRouter } from "./routers/tahlil";
import { stokRouter } from "./routers/stok";
import { odemeRouter } from "./routers/odeme";
import { bildirimRouter } from "./routers/bildirim";
import { mesajRouter } from "./routers/mesaj";
import { protokolRouter } from "./routers/protokol";
import { musaitlikRouter } from "./routers/musaitlik";
import { komplikasyonRouter } from "./routers/komplikasyon";
import { acilRouter } from "./routers/acil";
import { adminRouter } from "./routers/admin";
import { kvkkRouter } from "./routers/kvkk";

/** The application's single root router — the end-to-end type-safe API surface. */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  danisan: danisanRouter,
  egitmen: egitmenRouter,
  randevu: randevuRouter,
  tedavi: tedaviRouter,
  tahlil: tahlilRouter,
  stok: stokRouter,
  odeme: odemeRouter,
  bildirim: bildirimRouter,
  mesaj: mesajRouter,
  protokol: protokolRouter,
  musaitlik: musaitlikRouter,
  komplikasyon: komplikasyonRouter,
  acil: acilRouter,
  admin: adminRouter,
  kvkk: kvkkRouter,
});

export type AppRouter = typeof appRouter;

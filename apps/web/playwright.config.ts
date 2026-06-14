import { defineConfig, devices } from "@playwright/test";

/**
 * E2E — canli staging'e karsi (varsayilan app.shifahub.com.tr) salt-okunur smoke
 * akislari. Veri mutasyonu yok: giris (demo, silinebilir) + rol yonlendirme +
 * sayfa render dogrulamasi. CI'da `E2E_BASE_URL` ile yerel/baska ortama yonlenir.
 *
 * `turbo test` kapisina DAHIL DEGIL — ayri `npm run e2e` ile calisir (tarayici
 * binary'si + canli ortam gerektirir).
 */
const baseURL = process.env.E2E_BASE_URL ?? "https://app.shifahub.com.tr";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "tr-TR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

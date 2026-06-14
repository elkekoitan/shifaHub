import { defineConfig } from "vitest/config";

/**
 * Web birim testleri (henuz yok) vitest ile, E2E ise Playwright ile (`npm run e2e`)
 * calisir. e2e/ klasoru Playwright spec'leri icerir; vitest bunlari toplamamali —
 * aksi halde @playwright/test import'u vitest altinda patlar. Bu yuzden exclude'a
 * eklenir. Su an birim test olmadigindan `--passWithNoTests` ile yesil gecer.
 */
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/e2e/**"],
  },
});

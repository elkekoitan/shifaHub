import { test, expect } from "@playwright/test";

/**
 * Salt-okunur smoke akislari (veri mutasyonu yok). Demo kimlik bilgileri
 * silinebilir; gercek danisan verisi degildir.
 */

const DEMO_DANISAN = { email: "demo.danisan@shifahub.app", password: "danisan123" };

test.describe("ShifaHub smoke (canli staging)", () => {
  test("giris sayfasi yuklenir ve marka + form gorunur", async ({ page }) => {
    await page.goto("/giris");
    await expect(page.getByText("Tekrar hoş geldiniz")).toBeVisible();
    await expect(page.getByRole("button", { name: /Giriş yap/i })).toBeVisible();
    // Sol panel deger onerisi
    await expect(page.getByText(/Bütünsel tedavinin/i)).toBeVisible();
  });

  test("bilinmeyen korumali rota giris'e yonlendirir", async ({ page }) => {
    await page.goto("/danisan");
    await expect(page).toHaveURL(/\/giris$/);
  });

  test("demo danisan girisi -> onboarding karsilama (ilk giris)", async ({ page }) => {
    await page.goto("/giris");
    await page.getByPlaceholder(/ornek@shifahub/i).fill(DEMO_DANISAN.email);
    await page.locator('input[type="password"]').fill(DEMO_DANISAN.password);
    await page.getByRole("button", { name: /Giriş yap/i }).click();

    // Yeni tarayici context'i -> onboarding bayragi yok -> /onboarding'e yonlenir.
    await page.waitForURL(/\/(onboarding|danisan)\b/, { timeout: 15_000 });
    await expect(page.getByText(/hoş geldiniz|Yaklaşan randevu/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

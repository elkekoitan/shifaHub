---
name: Auth Agent
description: Kimlik dogrulama, yetkilendirme, KVKK consent yonetimi - JWT, MFA, RBAC
---

# Auth Agent

## Ne Zaman Tetiklenir
- Kullanici kayit, giris, oturum yonetimi ile ilgili gorevlerde
- MFA (cok faktorlu dogrulama) islemlerinde
- RBAC (rol tabanli erisim kontrolu) ayarlarinda
- KVKK riza yonetimi islemlerinde
- Sprint 1 gorevleri: T-004, T-005, T-011, T-013, T-014

## Sorumluluklar
1. **JWT + Refresh Token** oturum yonetimi (jose kutuphanesi)
2. **MFA:** TOTP tabanli (otpauth), QR kod ile kayit, 6 haneli dogrulama
3. **RBAC Rolleri:**
   - Danisan (hasta) - kendi verilerine erisim
   - Egitmen (uygulayici) - danisan verilerine erisim (atanmis)
   - Admin - tum sistem yonetimi
   - Tabip (sorumlu hekim) - klinik gozetim
   - KVKK Sorumlusu - denetim ve raporlama
4. **Password Hashing:** argon2 (ASLA bcrypt kullanma)
5. **Brute Force Koruma:** @fastify/rate-limit + hCaptcha
6. **KVKK Consent:** Amac bazli riza yonetimi, versiyon takibi
7. **Oturum Suresi:** 30 dakika inaktivite timeout

## Anahtar Dosyalar
- `apps/api/agents/auth-agent.ts` - Ajan implementasyonu
- `apps/api/routes/auth.ts` - tRPC auth router
- `apps/api/db/schema/users.ts` - Kullanici tablosu (Drizzle)
- `apps/api/db/schema/kvkk_consent.ts` - KVKK riza tablosu
- `apps/web/app/(auth)/giris/page.tsx` - Giris sayfasi
- `apps/web/app/(auth)/kayit/page.tsx` - Kayit sayfasi

## Event Tipleri
- `USER_REGISTER` - Yeni kullanici kayit
- `USER_LOGIN` - Kullanici girisi
- `MFA_VERIFY` - MFA dogrulama
- `SESSION_REFRESH` - Oturum yenileme
- `CONSENT_UPDATE` - KVKK riza guncelleme
- `PASSWORD_RESET` - Sifre sifirlama

## Teknolojiler
- jose (JWT islemleri)
- argon2 (password hashing)
- otpauth (TOTP MFA)
- @fastify/rate-limit
- hCaptcha (bot koruma)

## Test Plani
- Giris/cikis akisi E2E (Playwright)
- JWT token suresi ve yenileme unit test
- MFA QR + dogrulama akisi
- RBAC erisim kontrolu her rol icin
- Brute force rate limit testi
- KVKK consent versiyonlama testi

## Dikkat
- Access token suresi: 15 dakika
- Refresh token suresi: 7 gun
- MFA zorunlu: sadece Egitmen ve Admin icin
- Her basarili/basarisiz giris audit_log'a kaydedilmeli
- TC kimlik validasyonu: 11 hane, modulo kontrol

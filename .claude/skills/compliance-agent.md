---
name: Compliance Agent
description: KVKK uyumluluk - audit log, consent yonetimi, veri maskeleme, retention
---

# Compliance Agent

## Ne Zaman Tetiklenir
- KVKK denetim log islemlerinde
- Riza yonetimi (consent) islemlerinde
- Veri silme/anonimlestime taleplerinde
- Sprint 1, 6 gorevleri: T-006, T-017, T-047, T-065, T-066, T-078

## Sorumluluklar
1. **Audit Log:**
   - Her veri erisiminde kayit (audit_log tablosu)
   - Kim, ne zaman, hangi veri, hangi islem
   - Degistirilemez log (append-only)
   - 10 yil retention
2. **KVKK Consent (Riza) Yonetimi:**
   - Amac bazli acik riza toplama
   - Riza versiyonlama (her guncelleme yeni versiyon)
   - Riza geri cekme operasyonel akis
   - Riza durumu: Aktif, Geri Cekildi, Suresi Doldu
3. **Veri Maskeleme:**
   - TC Kimlik: pgcrypto AES-256 sifreleme
   - Telefon: UI'da son 4 hane, DB'de sifreli
   - Saglik verisi: ayri sifreleme anahtari
   - Email: k***@e***.com formatinda
4. **Veri Retention:**
   - Saglik verisi: 20-30 yil
   - Iletisim kayitlari: 5 yil
   - Sistem loglari: 2 yil
   - Silinen veriler: 30 gun soft-delete, sonra hard-delete
5. **Veri Ihlaali Bildirimi:**
   - 72 saat icinde KVKK Kurulu'na bildirim
   - Etkilenen kisilere bildirim
   - Ihlaali kaydi ve analizi

## Anahtar Dosyalar
- `apps/api/agents/compliance-agent.ts`
- `apps/api/db/schema/audit_log.ts`
- `apps/api/db/schema/kvkk_consent.ts`
- `apps/api/routes/kvkk.ts`
- `apps/api/middleware/audit-logger.ts`
- `apps/web/app/(admin)/kvkk/page.tsx`

## Event Tipleri
- `DATA_ACCESSED` - Veriye erisim
- `DATA_MODIFIED` - Veri degisikligi
- `DATA_DELETED` - Veri silme
- `CONSENT_GRANTED` - Riza verildi
- `CONSENT_REVOKED` - Riza geri cekildi
- `BREACH_DETECTED` - Ihlaali tespit edildi

## KVKK Yasal Referanslar
- Kanun 6698 - Kisisel Verilerin Korunmasi
- Ozel nitelikli kisisel veri: saglik, biyometrik, genetik
- Veri sorumlusu yukumlulukleri: bilgilendirme, riza, gizlilik
- Veri isleme sartlari: acik riza VEYA kanuni zorunluluk

## Test Plani
- Audit log kayit dogrulamasi (her CRUD isleminde)
- Consent versiyon takibi testi
- Veri maskeleme dogrulama (TC, telefon, email)
- Retention suresi dolmus veri silme testi
- Riza geri cekme akisi E2E

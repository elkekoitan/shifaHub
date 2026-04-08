---
name: Finance Agent
description: Finans yonetimi - odeme kaydi, tedavi-odeme eslestirme, gunluk kasa raporu
---

# Finance Agent

## Ne Zaman Tetiklenir
- Odeme kaydi olusturma/guncelleme islemlerinde
- Gunluk kasa raporu cikarma islemlerinde
- Faz 2 gorevleri: T-087_fin - T-089_fin

## Sorumluluklar
1. **Odeme Kaydi:**
   - Manuel odeme girisi (nakit, kart, havale/EFT)
   - Tedavi-odeme eslestirme
   - Kismi odeme destegi
   - Ucretsiz tedavi isaretleme
2. **Odeme Durumlari:**
   - Odendi (tam)
   - Beklemede
   - Kismi (kalan tutar takibi)
   - Ucretsiz (kayit tutulur)
3. **Gunluk Kasa Raporu:**
   - Nakit/kart/havale bazli ozet
   - Tedavi tipi bazli gelir dagilimi
   - PDF cikti (react-pdf)
4. **Makbuz/Dekont:**
   - Otomatik PDF makbuz olusturma
   - Danisana email ile gonderme (opsiyonel)

## Anahtar Dosyalar
- `apps/api/agents/finance-agent.ts`
- `apps/api/routes/odeme.ts`
- `apps/api/db/schema/odeme.ts`
- `apps/web/app/(dashboard)/odeme/page.tsx`

## Event Tipleri
- `PAYMENT_RECORDED` - Odeme kaydedildi
- `PAYMENT_UPDATED` - Odeme guncellendi
- `DAILY_REPORT_GENERATED` - Gunluk kasa raporu uretildi

## Test Plani
- Odeme CRUD islemleri
- Kismi odeme + kalan tutar hesabi
- Gunluk kasa raporu dogrulama
- PDF makbuz uretimi

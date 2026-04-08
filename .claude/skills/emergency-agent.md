---
name: Emergency Agent
description: Acil durum yonetimi - komplikasyon raporlama, bildirim zinciri, takip formu
---

# Emergency Agent

## Ne Zaman Tetiklenir
- Komplikasyon raporlama islemlerinde
- Acil durum bildirim zinciri tetiklenmesinde
- Takip formu olusturma/guncelleme islemlerinde
- Faz 2 gorevleri: T-090_emr - T-092_emr

## Sorumluluklar
1. **Komplikasyon Raporlama:**
   - Tek butonla acil bildirim (Egitmen ekrani)
   - Komplikasyon tipi, aciklama, foto
   - Otomatik zaman damgasi
   - Iliskili tedavi kaydi baglama
2. **Bildirim Zinciri (Severity-based):**
   ```
   Seviye 1-2: Kayit + bilgilendirme (admin email)
   Seviye 3:   + Sorumlu tabip bildirim
   Seviye 4:   + Admin acil bildirim + Telegram
   Seviye 5:   + 112 bilgi karti + Bakanlik rapor sablonu
   ```
3. **Takip Formu:**
   - 24 saat sonra: ilk takip
   - 48 saat sonra: ikinci takip
   - 1 hafta sonra: kapanış degerlendirmesi
   - Her takipte: foto + notlar + durum
4. **112 Bilgi Karti:**
   - Danisan bilgileri (ad, yas, cinsiyet)
   - Uygulanan tedavi detayi
   - Komplikasyon aciklamasi
   - Egitmen iletisim bilgisi
   - Otomatik PDF uretimi

## Anahtar Dosyalar
- `apps/api/agents/emergency-agent.ts`
- `apps/api/routes/acil.ts`
- `apps/api/db/schema/komplikasyon.ts`
- `apps/web/app/(dashboard)/acil/page.tsx`
- `apps/web/components/emergency-button/`

## Event Tipleri
- `COMPLICATION_REPORTED` - Komplikasyon raporlandi
- `EMERGENCY_CHAIN_TRIGGERED` - Bildirim zinciri tetiklendi
- `FOLLOWUP_DUE` - Takip zamani geldi
- `FOLLOWUP_COMPLETED` - Takip tamamlandi
- `EMERGENCY_RESOLVED` - Acil durum cozuldu

## Bagimliliklar
- **Notification Agent:** SMS/Push/Email gonderimi
- **Telegram Agent:** Admin acil uyari
- **Clinical Agent:** Iliskili tedavi kaydi

## Test Plani
- Komplikasyon raporlama akisi E2E
- Her severity seviyesi icin bildirim zinciri
- Takip formu zamanlama testi (24h/48h/1w)
- 112 bilgi karti PDF uretimi

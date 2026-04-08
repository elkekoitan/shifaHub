---
name: Analytics Agent
description: Raporlama ve analitik - PDF rapor, metrik hesaplama, dashboard veri beslemesi
---

# Analytics Agent

## Ne Zaman Tetiklenir
- Dashboard metrik hesaplamalarinda
- Rapor uretme (PDF) islemlerinde
- Performans analizi ve trend raporlarinda
- Sprint 5 gorevleri: T-039, T-067 - T-070, T-114, T-121

## Sorumluluklar
1. **Dashboard Metrikleri:**
   - Gunluk/haftalik/aylik danisan sayisi
   - Tedavi tipi dagilimi (pasta grafik)
   - Randevu doluluk orani
   - Gelir ozeti (gunluk kasa)
   - Chatbot kullanim istatistikleri
2. **Rapor Uretimi (PDF):**
   - react-pdf ile profesyonel raporlar
   - Danisan ilerleme raporu
   - Egitmen performans raporu
   - KVKK denetim raporu
   - Aylik/ceyreklik ozet rapor
3. **Trend Analizi:**
   - Kan degeri trendleri (cizgi grafik)
   - Tedavi basari analizi (anonim)
   - Randevu tamamlanma orani
   - SMS/email acilma orani
4. **Grafik Kutuphanesi:**
   - Recharts (tum grafikler)
   - Cizgi, cubuk, pasta, alan grafikleri
   - Responsive tasarim

## Anahtar Dosyalar
- `apps/api/agents/analytics-agent.ts`
- `apps/api/routes/rapor.ts`
- `apps/web/app/(dashboard)/dashboard/page.tsx`
- `apps/web/components/charts/`

## Event Tipleri
- `REPORT_REQUESTED` - Rapor istendi
- `REPORT_GENERATED` - Rapor uretildi
- `METRICS_CALCULATED` - Metrikler hesaplandi

## Test Plani
- Metrik hesaplama dogruluk testi
- PDF rapor uretimi ve icerik dogrulamasi
- Grafik veri beslemesi testi

---
name: Calendar Agent
description: Hicri-Miladi takvim donusumu, Umm al-Qura, sunnet gunleri, ozel gunler
---

# Calendar Agent

## Ne Zaman Tetiklenir
- Hicri tarih hesaplama/goruntuleme islemlerinde
- Sunnet gunleri (hacamat) hesaplamada
- Takvim senkronizasyonu islemlerinde
- Sprint 3 gorevleri: T-022, T-023, T-043

## Sorumluluklar
1. **Hicri-Miladi Donusum:**
   - Intl.DateTimeFormat ile Umm al-Qura algoritmasi
   - Paralel gosterim: "15 Ramazan 1447 / 8 Mart 2026"
   - Locale: `ar-SA-u-ca-islamic-umalqura`
2. **Sunnet Gunleri:**
   - Hacamat sunnet gunleri: Hicri ayin 17, 19, 21. gunleri
   - Otomatik isaretleme (yesil renk)
   - Bildirim: sunnet gunu oncesi hatirlatma
3. **Ozel Gunler:**
   - Ramazan baslangic/bitis
   - Kurban/Ramazan Bayramlari
   - Muharrem ayi (ozel dikkat gerektiren donem)
   - Receb/Saban aylari
4. **Takvim Gorunumleri:**
   - Gun/Hafta/Ay goruntuleme
   - Hicri + Miladi paralel baslik
   - Mobil responsive (320px+)

## Anahtar Dosyalar
- `apps/web/lib/hijri-calendar.ts` - Hicri takvim utility
- `apps/api/agents/calendar-agent.ts` - Ajan implementasyonu
- `apps/web/components/calendar/hijri-display.tsx` - Hicri gosterim
- `apps/web/components/calendar/sunnah-days.tsx` - Sunnet gunleri

## Anahtar Fonksiyonlar
```typescript
formatHijriDate(date: Date): string
getHijriSunnahDays(month: number, year: number): Date[]
isHijriSunnahDay(date: Date): boolean
getHijriSpecialDays(year: number): SpecialDay[]
hijriToGregorian(hijriDate: HijriDate): Date
gregorianToHijri(date: Date): HijriDate
```

## Event Tipleri
- `SUNNAH_DAY_APPROACHING` - Sunnet gunu yaklasıyor
- `SPECIAL_DAY_REMINDER` - Ozel gun hatirlatmasi
- `CALENDAR_SYNC` - Takvim senkronizasyonu

## Test Plani
- Hicri-Miladi donusum dogruluk testi (100+ tarih)
- Sunnet gunleri hesaplama (12 ay x 3 gun)
- Ozel gun tespiti (Ramazan, Bayram)
- Edge case: ay gecisi, yil gecisi

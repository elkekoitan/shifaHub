---
name: Booking Agent
description: Randevu yonetimi - CRUD, availability, state machine, catisma algilama, hatirlatilar
---

# Booking Agent

## Ne Zaman Tetiklenir
- Randevu olusturma, guncelleme, iptal islemlerinde
- Egitmen musaitlik ayarlarinda
- Takvim goruntuleme ve catisma kontrollerinde
- Sprint 3 gorevleri: T-019 - T-025, T-071, T-072

## Sorumluluklar
1. **Randevu CRUD:** Olusturma, okuma, guncelleme, iptal
2. **Musaitlik Yonetimi:** Haftalik program, ozel gun bloklari, tatil isaretleme
3. **Catisma Algilama:** Cift rezervasyon onleme, ust uste gelen slotlar
4. **State Machine:**
   ```
   Requested -> Confirmed -> Reminded -> Arrived -> Treated -> Completed
                    |                                    |
                    v                                    v
                 Cancelled                          No-Show
   ```
5. **Hatirlatilar:** 24 saat + 1 saat oncesi otomatik (BullMQ delayed job)
6. **Tekrarlayan Randevular:** Haftalik/2 haftalik/aylik periyod
7. **Bekleme Listesi:** Dolu slotlar icin otomatik bildirim

## Anahtar Dosyalar
- `apps/api/agents/booking-agent.ts` - Ajan implementasyonu
- `apps/api/routes/randevu.ts` - tRPC randevu router
- `apps/api/db/schema/randevu.ts` - Randevu tablosu
- `apps/api/db/schema/musaitlik.ts` - Musaitlik tablosu
- `apps/web/app/(dashboard)/randevu/page.tsx` - Randevu sayfasi
- `apps/web/components/calendar/` - Takvim componentleri

## Event Tipleri
- `APPOINTMENT_CREATED` - Yeni randevu
- `APPOINTMENT_CONFIRMED` - Randevu onaylandi
- `APPOINTMENT_CANCELLED` - Randevu iptal
- `APPOINTMENT_REMINDED` - Hatirlatma gonderildi
- `APPOINTMENT_ARRIVED` - Danisan geldi
- `APPOINTMENT_COMPLETED` - Randevu tamamlandi
- `APPOINTMENT_NO_SHOW` - Gelmedi

## Bagimliliklar
- **Calendar Agent:** Hicri tarih hesaplama, sunnet gunleri isaretleme
- **Notification Agent:** SMS/Push/Email hatirlati tetikleme
- **WhatsApp Agent:** WhatsApp uzerinden randevu onay/hatirlati

## Takvim Entegrasyonu
- Miladi + Hicri paralel gosterim
- Hacamat sunnet gunleri: Hicri 17, 19, 21 otomatik isaretleme
- Gun/Hafta/Ay gorunumleri
- Drag & drop ile randevu tasima (dnd-kit)
- Renk kodlama: tedavi tipine gore

## Test Plani
- Randevu olusturma + catisma kontrolu
- State machine gecisleri (tum valid/invalid)
- Hatirlati zamanlama testi (BullMQ)
- Tekrarlayan randevu serisi olusturma
- Hicri takvim ile randevu goruntuleme

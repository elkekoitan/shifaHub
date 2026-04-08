---
name: Notification Agent
description: Cok kanalli bildirim - SMS (Netgsm), Push (FCM), Email (Resend), template yonetimi
---

# Notification Agent

## Ne Zaman Tetiklenir
- Randevu hatirlati gondermede
- Sistem bildirimi gondermede
- Email/SMS/Push bildirim islemlerinde
- Sprint 3, 5 gorevleri: T-018, T-026 - T-028, T-041, T-042, T-099

## Sorumluluklar
1. **SMS Bildirimleri (Netgsm):**
   - Randevu hatirlati (24h + 1h)
   - OTP dogrulama kodu
   - Acil durum bildirimi
   - Turkce karakter destegi (160 karakter limit)
2. **Push Bildirimleri (FCM):**
   - PWA Service Worker ile push
   - Foreground + background bildirim
   - Topic-based gruplama
3. **Email Bildirimleri (Resend):**
   - Randevu ozeti
   - Tahlil sonucu
   - Haftalik rapor
   - KVKK bilgilendirme
   - Free tier: 3000 email/ay
4. **Template Yonetimi:**
   - Handlebars.js sablonlari
   - Dinamik degiskenler (ad, tarih, saat, tedavi)
   - Dil destegi (Turkce)
5. **Zamanlama (BullMQ):**
   - Delayed jobs: 24h + 1h hatirlati
   - Cron jobs: haftalik rapor, gunluk ozet
   - Retry politikasi: 3 deneme, exponential backoff

## Bildirim Tipleri
| Tip | SMS | Push | Email | WhatsApp |
|-----|-----|------|-------|----------|
| Randevu hatirlati | x | x | x | x |
| Randevu onay | x | x | - | x |
| Tedavi ozeti | - | - | x | x |
| Tahlil sonucu | - | x | x | - |
| OTP kodu | x | - | - | - |
| Acil durum | x | x | x | x |
| Haftalik rapor | - | - | x | - |
| Stok uyari | - | x | - | x (TG) |

## Anahtar Dosyalar
- `apps/api/agents/notification-agent.ts` - Ajan implementasyonu
- `apps/api/workers/notification.ts` - BullMQ notification worker
- `apps/api/routes/bildirim.ts` - tRPC bildirim router
- `apps/api/services/sms.ts` - Netgsm entegrasyonu
- `apps/api/services/push.ts` - FCM entegrasyonu
- `apps/api/services/email.ts` - Resend entegrasyonu

## Event Tipleri
- `NOTIFICATION_SEND` - Bildirim gonder
- `NOTIFICATION_DELIVERED` - Teslim edildi
- `NOTIFICATION_FAILED` - Gonderim hatasi
- `NOTIFICATION_READ` - Okundu
- `REMINDER_SCHEDULED` - Hatirlati zamanlandi
- `REMINDER_TRIGGERED` - Hatirlati tetiklendi

## Test Plani
- SMS gonderim + Turkce karakter testi
- Push bildirim (foreground + background)
- Email sablon render testi
- BullMQ delayed job zamanlama dogrulamasi
- Retry mekanizmasi testi

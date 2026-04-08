---
name: Telegram Agent
description: Telegram bot - grammy framework, egitmen/admin komutlari, proaktif bildirimler
---

# Telegram Agent

## Ne Zaman Tetiklenir
- Telegram bot gelistirme/guncelleme islemlerinde
- Bot komut ekleme/degistirmede
- Proaktif bildirim sistemi kurulusunda
- Faz 2 gorevleri: T-079 - T-082_tg

## Sorumluluklar
1. **Bot Kurulumu:**
   - Framework: grammy (TypeScript-first)
   - Webhook mode (polling degil)
   - Bot username: @ShifaHubBot
2. **Egitmen Komutlari:**
   - `/ajanda` - Gunluk randevu listesi
   - `/stok` - Kritik stok durumlari
   - `/not` - Hizli tedavi notu ekleme
   - `/acil` - Komplikasyon bildirimi
   - `/danisan [ad]` - Danisan bilgi arama
   - `/takvim` - Haftalik program
   - `/sunnet` - Sonraki sunnet gunleri
   - `/yardim` - Komut listesi
3. **Admin Komutlari:**
   - `/durum` - Sistem saglik durumu
   - `/komplikasyonlar` - Acik komplikasyonlar
   - `/bekleyen` - Onay bekleyen egitmenler
   - `/istatistik` - Gunluk ozet metrikler
   - `/yedek` - Manuel yedekleme tetikle
   - `/kullanicilar` - Aktif kullanici sayisi
   - `/log [seviye]` - Son sistem loglari
4. **Proaktif Bildirimler:**
   - Sabah ajandasi (08:00, gunluk randevu ozeti)
   - Acil durum uyarisi (aninda)
   - Stok kritik seviye (stok < minimum)
   - Sunnet gunleri hatirlatma (1 gun once)
   - Haftalik performans ozeti (Pazar 20:00)
   - Sistem uyari (disk/memory/CPU)

## Anahtar Dosyalar
- `apps/api/agents/telegram-agent.ts`
- `apps/api/webhooks/telegram.ts`
- `apps/api/services/telegram-bot.ts`
- `apps/api/services/telegram-commands/`

## Event Tipleri
- `TG_COMMAND_RECEIVED` - Komut alindi
- `TG_NOTIFICATION_SENT` - Bildirim gonderildi
- `TG_PROACTIVE_TRIGGERED` - Proaktif bildirim tetiklendi

## Konfigurrasyon
```
Framework: grammy
Mode: Webhook (https://api.shifahub.app/webhooks/telegram)
Token: TELEGRAM_BOT_TOKEN env var
Admin Chat IDs: Coolify env var
```

## Test Plani
- Her komut icin birim testi
- Webhook isleme testi
- Proaktif bildirim zamanlama testi
- Hata durumu yonetimi (bot cevapsiz)

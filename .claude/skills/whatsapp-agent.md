---
name: WhatsApp Agent
description: WhatsApp entegrasyonu - Evolution API, mesaj sablonlari, chatbot routing, QR yonetimi
---

# WhatsApp Agent

## Ne Zaman Tetiklenir
- WhatsApp mesaj gonderme/alma islemlerinde
- Evolution API konfigurasyonunda
- WhatsApp chatbot gelistirmede
- Faz 2 gorevleri: T-073 - T-078

## Sorumluluklar
1. **Evolution API Yonetimi:**
   - Docker container: `atendai/evolution-api:latest`
   - Instance olusturma/baglama
   - QR kod ile WhatsApp baglantisi
   - Baglanti durumu izleme + otomatik yeniden baglama
2. **Mesaj Gonderi:**
   - Text mesaj
   - Button mesaj (3 secenekli)
   - Template mesaj (onaylanmis)
   - Medya mesaj (gorsel, PDF)
3. **Webhook Alici:**
   - Gelen mesajlari isleme
   - Durum guncellemelerini takip (delivered, read)
   - Mesaj tipi routing
4. **Chatbot Akisi:**
   ```
   Hosgeldiniz -> Menu:
   1. Randevularim (aktif randevulari listele)
   2. Yeni Randevu (uygun slotlari goster)
   3. Tedavi Bilgisi (son tedavi ozeti)
   4. AI Asistan (Knowledge Agent'a yonlendir)
   5. Yardim (iletisim bilgileri)
   ```
5. **KVKK WhatsApp:**
   - Opt-in/opt-out akisi
   - Riza metni gonderimi
   - Numara dogrulama

## Mesaj Sablonlari
| Sablon | Degiskenler | Kullanim |
|--------|-------------|----------|
| randevu_hatirlatma | ad, tarih, saat, egitmen | 24h + 1h once |
| randevu_onay | ad, tarih, saat | Randevu sonrasi |
| tedavi_ozeti | ad, tedavi_tipi, tarih | Tedavi sonrasi |
| hosgeldiniz | ad | Ilk kayit |
| tahlil_hatirlatma | ad, tahlil_tipi | Tahlil zamani |

## Anahtar Dosyalar
- `apps/api/agents/whatsapp-agent.ts`
- `apps/api/webhooks/whatsapp.ts`
- `apps/api/services/evolution-api.ts`
- `apps/web/app/(admin)/whatsapp/page.tsx` - QR + instance yonetimi

## Evolution API Konfigurasyonu
```
Image: atendai/evolution-api:latest
Domain: wa.shifahub.app
Port: 8080
Database: PostgreSQL (evolution DB)
Cache: Redis (DB 1)
Env:
  AUTHENTICATION_API_KEY=<generated>
  SERVER_URL=https://wa.shifahub.app
  WEBHOOK_GLOBAL_URL=https://api.shifahub.app/webhooks/whatsapp
```

## Event Tipleri
- `WA_MESSAGE_RECEIVED` - Mesaj alindi
- `WA_MESSAGE_SENT` - Mesaj gonderildi
- `WA_MESSAGE_DELIVERED` - Teslim edildi
- `WA_MESSAGE_READ` - Okundu
- `WA_CONNECTION_LOST` - Baglanti koptu
- `WA_QR_GENERATED` - QR kod olusturuldu

## Bagimliliklar
- **Knowledge Agent:** AI Asistan seceneginde RAG chatbot
- **Booking Agent:** Yeni randevu olusturma akisi
- **Notification Agent:** Hatirlati tetikleme

## Test Plani
- Evolution API baglanti testi
- Mesaj gonderim/alim testi
- Chatbot menu akisi E2E
- QR kod yenileme testi
- Webhook isleme testi

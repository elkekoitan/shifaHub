---
name: Inventory Agent
description: Stok yonetimi - malzeme takibi, minimum uyari, tedavi-stok otomatik dusme
---

# Inventory Agent

## Ne Zaman Tetiklenir
- Stok ekleme/cikis islemlerinde
- Minimum stok uyari kontrollerinde
- Tedavi sonrasi otomatik stok dusme isleminde
- Faz 2 gorevleri: T-083_inv - T-086_inv

## Sorumluluklar
1. **Stok Takibi:**
   - Malzeme ekleme/cikarma
   - Lot/batch numarasi takibi
   - Son kullanma tarihi izleme
   - Barkod/QR destegi (opsiyonel)
2. **Minimum Stok Uyari:**
   - Her malzeme icin minimum seviye tanimlama
   - Kritik seviyede otomatik bildirim (Push + Telegram)
   - Siparis onerileri
3. **Tedavi-Stok Entegrasyonu:**
   - Tedavi kaydedildiginde otomatik stok dusme
   - Tedavi tipine gore standart malzeme listesi
   - Manuel duzeltme imkani
4. **Malzeme Kategorileri:**
   - Kupalar (cam, silikon, plastik)
   - Tibbi Sulukler (canli stok - ozel takip)
   - Sarf Malzemeler (eldiven, pamuk, dezenfektan)
   - Bitkisel Urunler (yag, krem, bitki)
   - Akupunktur Igneleri (boyut bazli)

## Anahtar Dosyalar
- `apps/api/agents/inventory-agent.ts`
- `apps/api/routes/stok.ts`
- `apps/api/db/schema/stok.ts`
- `apps/web/app/(dashboard)/stok/page.tsx`

## Event Tipleri
- `STOCK_ADDED` - Stok eklendi
- `STOCK_DEDUCTED` - Stok dusuldu
- `STOCK_LOW_ALERT` - Minimum seviye uyarisi
- `STOCK_EXPIRED_ALERT` - Son kullanma tarihi uyarisi

## Test Plani
- Stok CRUD islemleri
- Otomatik stok dusme (tedavi sonrasi)
- Minimum seviye uyari tetikleme
- Son kullanma tarihi kontrolu

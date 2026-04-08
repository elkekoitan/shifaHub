---
name: DB Migrate Skill
description: Drizzle ORM migration workflow - schema degisikligi, migration olusturma, rollback
---

# DB Migrate Skill

## Ne Zaman Tetiklenir
- Veritabani schema degisikligi yapildiginda
- Migration olusturma/calistirma islemlerinde
- Seed data yonetiminde

## Drizzle ORM Workflow

### Schema Degisikligi
1. Schema dosyasini duzenle: `apps/api/db/schema/*.ts`
2. Migration olustur:
   ```bash
   cd apps/api
   npx drizzle-kit generate
   ```
3. Migration inceleme: `apps/api/db/migrations/` altinda SQL dosyasi
4. Migration uygula:
   ```bash
   npx drizzle-kit push
   ```

### Yeni Tablo Ekleme
1. `apps/api/db/schema/` altinda yeni dosya olustur
2. Drizzle table definition yaz (pgTable)
3. `apps/api/db/schema/index.ts`'a export ekle
4. Migration olustur ve uygula

### Rollback
```bash
# Son migration'i geri al
npx drizzle-kit drop
```

### Seed Data
```bash
cd apps/api
npx tsx db/seed.ts
```

## Schema Dosya Yapisi
```
apps/api/db/
  schema/
    index.ts           # Tum tablo export'lari
    users.ts           # Kullanici + auth
    danisan.ts         # Danisan (hasta)
    egitmen.ts         # Egitmen (uygulayici)
    randevu.ts         # Randevu
    tedavi.ts          # Tedavi kayitlari
    tahlil.ts          # Tahlil sonuclari
    stok.ts            # Stok/envanter
    odeme.ts           # Odeme kayitlari
    komplikasyon.ts    # Komplikasyon raporlari
    bildirim.ts        # Bildirimler
    mesaj.ts           # Guvenli mesajlasma
    audit_log.ts       # KVKK audit log
    kvkk_consent.ts    # KVKK riza kayitlari
    kulliyat.ts        # Bilgi tabani kaynaklari
    musaitlik.ts       # Egitmen musaitlik
  migrations/          # Otomatik olusturulan SQL dosyalari
  seed.ts              # Baslangic veri
  drizzle.config.ts    # Drizzle konfigurasyonu
```

## Onemli Kurallar
- Migration oncesi MUTLAKA backup al
- Production'da migration manuel onay ile
- RLS policy'leri her tabloda zorunlu
- pgcrypto extension aktif olmali (TC/telefon sifrelemesi)
- UUID primary key tum tablolarda

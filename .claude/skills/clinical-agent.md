---
name: Clinical Agent
description: Tedavi yonetimi - protokoller, anamnez, NER pipeline, kan degerleri, vucut haritasi
---

# Clinical Agent

## Ne Zaman Tetiklenir
- Tedavi kaydı olusturma/guncelleme islemlerinde
- Anamnez formu doldurma/degerlendirmede
- Kan degeri girisi ve trend analizinde
- NER (Named Entity Recognition) pipeline islemlerinde
- Sprint 4 gorevleri: T-003, T-012, T-029 - T-036, T-054 - T-056

## Sorumluluklar
1. **Tedavi Protokol Motoru:**
   - Oncelik bazli coklu sikayet yonetimi (1-5 arasi)
   - Her sikayet icin: sikayetler, bulgular, uygulanan tedavi, oneriler
   - Onceki/sonrasi karsilastirma (foto + notlar)
   - Sonraki seans onerileri
2. **Anamnez Degerlendirme:**
   - Kapsamli saglik gecmisi formu (50+ alan)
   - Alerji/ilac etkilesim uyarilari
   - Kronik hastalik takibi
3. **Kan Degeri Takibi:**
   - Standart parametreler (hemogram, biyokimya, tiroid, vit D/B12)
   - Trend grafigi (Recharts)
   - Referans aralik disindaki degerler icin uyari
4. **NER Pipeline:**
   ```typescript
   interface NERResult {
     diseases: string[]     // Hastaliklar
     herbs: string[]        // Bitkisel urunler
     bodyParts: string[]    // Vucut bolgeleri
     treatments: string[]   // Tedavi yontemleri
   }
   ```
   - Claude API ile Turkce metin analizi
   - Otomatik panel doldurma
5. **Vucut Haritasi:**
   - Fabric.js ile gorsel isaretleme
   - Hacamat/sujok noktalarini isaretleme
   - Onceki seans isaretlemelerini goruntuleme
6. **Kontraendikasyon Kontrolu:**
   - Ilac-tedavi etkilesim uyarilari
   - Yasak durumlar (hamilelik, kanama bozukluklari, vs.)

## Anahtar Dosyalar
- `apps/api/agents/clinical-agent.ts` - Ajan implementasyonu
- `apps/api/agents/clinical-agent/ner-pipeline.ts` - NER pipeline
- `apps/api/routes/tedavi.ts` - tRPC tedavi router
- `apps/api/routes/tahlil.ts` - tRPC tahlil router
- `apps/api/db/schema/tedavi.ts` - Tedavi tablosu
- `apps/api/db/schema/danisan.ts` - Danisan tablosu
- `apps/api/db/schema/tahlil.ts` - Tahlil tablosu
- `apps/web/app/(dashboard)/tedavi/` - Tedavi sayfalari
- `apps/web/components/body-map/` - Vucut haritasi

## Event Tipleri
- `TREATMENT_CREATED` - Yeni tedavi kaydi
- `TREATMENT_UPDATED` - Tedavi guncelleme
- `LAB_RESULT_ADDED` - Tahlil eklendi
- `LAB_RESULT_ALERT` - Referans disi deger
- `NER_EXTRACTED` - NER sonucu cikarildi
- `CONTRAINDICATION_ALERT` - Kontraendikasyon uyarisi

## Bagimliliklar
- **Knowledge Agent:** NER sonuclari ile vector search (iliskili bilgi getirme)
- **Media Agent:** Gorsel isleme (vucut haritasi fotolari, tahlil raporlari)
- **Compliance Agent:** Tedavi kayitlarinin KVKK uyumlulugu

## Test Plani
- Tedavi kaydi olusturma + coklu sikayet
- NER pipeline Turkce metin testi (10+ ornek)
- Kan degeri trend hesaplama
- Kontraendikasyon uyari sistemi
- Vucut haritasi isaretleme kayit/geri yukleme
- Gecmise donuk kayit olusturma

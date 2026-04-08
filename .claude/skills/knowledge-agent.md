---
name: Knowledge Agent
description: AI bilgi tabani - RAG pipeline, Qdrant vector DB, Claude chatbot, kaynak yonetimi
---

# Knowledge Agent

## Ne Zaman Tetiklenir
- AI chatbot soru-cevap islemlerinde
- Bilgi tabani kaynak ekleme/guncelleme islemlerinde
- Embedding olusturma ve vektorizasyonda
- Faz 3 gorevleri: T-105 - T-122

## Sorumluluklar
1. **RAG Pipeline:**
   ```
   Query -> Embedding -> Qdrant Search -> Context Assembly -> Claude Generate -> Response
   ```
   - Sorgu embedding: text-embedding-3-small (1536-dim)
   - Vektör arama: Qdrant (cosine similarity, top-5)
   - Context assembly: chunk'lari birlestir + kaynak referansi
   - Cevap uretimi: Claude API (guard rails + source citation)
2. **Qdrant Vector DB:**
   - Collection: `shifahub_kulliyat`
   - Vector size: 1536, distance: Cosine
   - Chunking: 512 token, 50 token overlap
   - Metadata: kaynak_id, kaynak_tipi, sayfa, tarih
3. **Kaynak Yonetimi:**
   - Kaynak tipleri: Hadis, tibbi literatür, GETAT düzenlemesi, ders notu
   - PDF/DOCX ingestion -> chunk -> embed -> upsert
   - Admin onayı sonrası aktif
   - Kaynak silme/guncelleme -> re-embedding
4. **Claude Chatbot:**
   - Egitmen: claude-sonnet-4-6 (detayli, bilimsel)
   - Danisan: claude-haiku-4-5 (basit, anlasilir)
   - Guard rails: Tip tavsiyesi vermez, kaynak gosterir
   - Hallucination guard: "Bu bilgi bilgi tabaninda bulunamadi" fallback
5. **GETAT Taksonomisi:**
   - ICD-10 eslemesi (opsiyonel)
   - Tedavi yontemleri siniflandirmasi
   - Bitkisel urun veritabani

## Anahtar Dosyalar
- `apps/api/agents/knowledge-agent.ts` - Ajan implementasyonu
- `apps/api/workers/embedding.ts` - BullMQ embedding worker
- `apps/api/routes/chatbot.ts` - tRPC chatbot router
- `apps/api/routes/kulliyat.ts` - Bilgi tabani yonetimi
- `apps/web/app/(dashboard)/chatbot/page.tsx` - Chatbot UI
- `apps/web/app/(admin)/kulliyat/page.tsx` - Admin bilgi yonetimi

## Event Tipleri
- `QUERY_RECEIVED` - Soru alindi
- `RETRIEVAL_COMPLETED` - Vektör arama tamamlandi
- `RESPONSE_GENERATED` - Cevap uretildi
- `SOURCE_INGESTED` - Kaynak islendi
- `SOURCE_EMBEDDED` - Embedding tamamlandi
- `REINDEX_REQUESTED` - Yeniden indeksleme

## Qdrant Konfigurasyonu
```
URL: http://shifahub-qdrant:6333
Collection: shifahub_kulliyat
Vector size: 1536
Distance: Cosine
Payload index: kaynak_tipi, kategori
```

## Test Plani
- RAG pipeline end-to-end (soru -> cevap + kaynak)
- Embedding dogruluk testi (benzer sorular)
- Guard rails testi (tip tavsiyesi reddi)
- Kaynak ingestion (PDF -> chunks -> vectors)
- Hallucination detection testi

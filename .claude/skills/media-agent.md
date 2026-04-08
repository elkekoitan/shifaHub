---
name: Media Agent
description: Dosya yonetimi - MinIO upload, gorsel isleme, Whisper STT, EXIF temizleme
---

# Media Agent

## Ne Zaman Tetiklenir
- Dosya yukleme (gorsel, PDF, ses, video) islemlerinde
- Ses kaydindan metin donusumu (STT) gerektiginde
- Gorsel anotasyon/isaretleme islemlerinde
- Sprint 2-4 gorevleri: T-016, T-057 - T-061, T-097

## Sorumluluklar
1. **MinIO Upload:**
   - S3-compatible API ile dosya yukleme
   - Presigned URL ile guvenli erisim
   - Bucket yapisi: `shifahub-uploads/{danisan|egitmen|kulliyat}/{id}/{category}/`
2. **Gorsel Isleme:**
   - Image compression (sharp kutuphanesi)
   - EXIF metadata temizleme (konum, cihaz bilgisi silme - KVKK)
   - Thumbnail olusturma (3 boyut: 150px, 300px, 800px)
   - WebP donusumu
3. **Whisper STT (Speech-to-Text):**
   - OpenAI Whisper API ile Turkce ses donusumu
   - Desteklenen formatlar: MP3, WAV, M4A, OGG
   - Transkript editor (duzenleme + onay)
   - Offline kayit + senkron (PWA)
4. **Gorsel Anotasyon:**
   - Fabric.js ile canvas isaretleme
   - Vucut haritasi + tedavi noktalari
   - Anotasyon katmani ayri kayit
5. **Dosya Politikalari:**
   - Max boyut: 100MB (gorsel: 20MB, ses: 50MB, video: 100MB)
   - Desteklenen formatlar: JPG/PNG/HEIF/WebP, PDF/DOCX, MP3/WAV/M4A/OGG, MP4/WebM
   - Virus tarama (opsiyonel: ClamAV)
   - Lifecycle policy: 1 yil sonra cold storage

## Anahtar Dosyalar
- `apps/api/agents/media-agent.ts` - Ajan implementasyonu
- `apps/api/routes/upload.ts` - Dosya yukleme route
- `apps/api/workers/media.ts` - BullMQ media worker
- `apps/web/components/file-upload/` - Upload componentleri
- `apps/web/components/audio-recorder/` - Ses kayit (WaveSurfer.js)
- `apps/web/components/image-annotator/` - Gorsel anotasyon (Fabric.js)

## Event Tipleri
- `FILE_UPLOADED` - Dosya yuklendi
- `FILE_PROCESSED` - Dosya islendi (compress/convert)
- `STT_COMPLETED` - Ses -> metin donusumu tamam
- `STT_FAILED` - STT hatasi
- `ANNOTATION_SAVED` - Anotasyon kaydedildi

## MinIO Konfigurasyonu
```
Endpoint: shifahub-minio:9000
Region: tr-istanbul
Buckets:
  - shifahub-uploads (ana depolama)
  - shifahub-backups (yedekleme)
Access: Internal network only (Coolify)
```

## Test Plani
- Coklu format yukleme testi
- EXIF metadata temizleme dogrulamasi
- Whisper STT Turkce dogruluk testi
- Buyuk dosya (100MB) upload performans
- Offline kayit + senkron senaryosu

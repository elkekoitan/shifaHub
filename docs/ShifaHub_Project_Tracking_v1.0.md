# ShifaHub — Proje Takip Dokümanı

**Project Tracking & Implementation Plan**

Versiyon: 2.0 | Tarih: 8 Nisan 2026 | Hazırlayan: Hamza Turhan + Claude Code AI
Son Guncelleme: 8 Nisan 2026 | Canli: https://q9rqagsabejx6y4sx7c9mzot.185.255.95.111.sslip.io

---

## 1. Proje Genel Bilgileri

| Alan | Deger |
|------|-------|
| Proje Adi | ShifaHub — Butunsel Tedavi Yonetim Platformu |
| Proje Tipi | Web Application (PWA) — Full-Stack |
| Baslangic Tarihi | 8 Nisan 2026 |
| Hedef MVP Tarihi | Temmuz 2026 (12 hafta) |
| Deploy Ortami | Coolify (self-hosted PaaS) - 185.255.95.111 |
| Gelistirme Modeli | Agentic Coding — Agent bazli moduler gelistirme |
| Repository | github.com/elkekoitan/shifaHub.git |
| Git Commits | 39 |
| Kaynak Dosya | 105 TS/TSX |
| DB Tablo | 16 |
| API Endpoint | 45+ |
| Frontend Sayfa | 33 |

---

## 2. Sprint Planlamasi

### Phase 1 — MVP (Hafta 1-12)

#### Sprint 1 (Hafta 1-2): Altyapi & Auth — 40 SP

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-001 | Monorepo kurulumu (Turborepo) | 3 | ✅ Done | — |
| T-002 | Next.js 16 app scaffold | 3 | ✅ Done | — |
| T-003 | PostgreSQL + Drizzle ORM schema tasarimi | 5 | ✅ Done | Clinical Agent |
| T-004 | Auth sistemi: JWT + Refresh Token + MFA | 8 | ✅ Done | Auth Agent |
| T-005 | RBAC (Danisan, Egitmen, Admin rolleri) | 5 | ✅ Done | Auth Agent |
| T-006 | KVKK acik riza modulu (consent management) | 5 | ✅ Done | Compliance Agent |
| T-007 | Coolify deploy pipeline | 3 | ✅ Done | — |
| T-008 | Docker Compose (dev environment) | 3 | ✅ Done | — |
| T-009 | ESLint + Prettier + Husky konfigurasyonu | 2 | ✅ Done | — |
| T-010 | Temel UI component library (shadcn/ui) | 3 | ✅ Done | — |

**Sprint 1: 40/40 SP ✅ TAMAMLANDI**

#### Sprint 2 (Hafta 3-4): Kayit & Profil — 44 SP

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-011 | Danisan kayit wizard (7 adimli) | 8 | ✅ Done | Auth Agent |
| T-012 | Anamnez formu (tum alanlar) | 8 | ✅ Done | Clinical Agent |
| T-013 | Egitmen kayit + sertifika yukleme | 5 | ✅ Done | Auth Agent |
| T-014 | Admin egitmen onay ekrani | 5 | ✅ Done | Auth Agent |
| T-015 | Profil duzenleme ekranlari (danisan + egitmen) | 5 | ✅ Done | — |
| T-016 | Dosya yukleme servisi (upload route + multipart) | 5 | ✅ Done | Media Agent |
| T-017 | KVKK onam formu (7 adimli kayit step 6) | 5 | ✅ Done | Compliance Agent |
| T-018 | E-posta dogrulama + OTP | 3 | ✅ Done | Notification Agent |

**Sprint 2: 44/44 SP ✅ TAMAMLANDI**

#### Sprint 3 (Hafta 5-6): Randevu Sistemi — 52 SP

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-019 | Randevu DB schema + API | 5 | ✅ Done | Booking Agent |
| T-020 | Egitmen musaitlik ayarlari | 5 | ✅ Done | Booking Agent |
| T-021 | Danisan randevu alma UI (egitmen arama + takvim) | 8 | ✅ Done | Booking Agent |
| T-022 | Hicri takvim entegrasyonu (Umm al-Qura) | 5 | ✅ Done | Calendar Agent |
| T-023 | Hicri/Miladi paralel gosterim UI | 5 | ✅ Done | Calendar Agent |
| T-024 | Egitmen ajanda — haftalik gorunum (gercek veri) | 8 | ✅ Done | Booking Agent |
| T-025 | Randevu durum akisi (state machine 8 durum) | 5 | ✅ Done | Booking Agent |
| T-026 | SMS bildirim entegrasyonu (Netgsm) | 3 | ⬜ Backlog | Notification Agent |
| T-027 | Push notification (FCM + PWA) | 5 | ⬜ Backlog | Notification Agent |
| T-028 | Randevu hatirlama cron job (5dk interval, 24h+1h) | 3 | ✅ Done | Notification Agent |

**Sprint 3: 44/52 SP (T-026 SMS, T-027 Push eksik)**

#### Sprint 4 (Hafta 7-8): Tedavi Kaydi Temel — 44 SP

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-029 | Tedavi kaydi DB schema + API | 5 | ✅ Done | Clinical Agent |
| T-030 | Tedavi kayit formu UI (stok dusme, kontrendikasyon) | 8 | ✅ Done | Clinical Agent |
| T-031 | Danisan detay ekrani (6 sekmeli tabbed layout) | 8 | ✅ Done | Clinical Agent |
| T-032 | Tahlil yukleme + goruntuleme (progress bar) | 5 | ✅ Done | Clinical Agent |
| T-033 | Kan degerleri giris formu + gorsel | 5 | ✅ Done | Clinical Agent |
| T-034 | Danisan listesi (aranabilir, tiklanabilir) | 5 | ✅ Done | Clinical Agent |
| T-035 | Tedavi gecmisi timeline gorunum | 5 | ✅ Done | Clinical Agent |
| T-036 | Eskiye donuk kayit girisi | 3 | ✅ Done | Clinical Agent |

**Sprint 4: 44/44 SP ✅ TAMAMLANDI**

#### Sprint 5 (Hafta 9-10): Dashboard & Bildirim — 43 SP

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-037 | Danisan dashboard (API bagli, gercek veri) | 8 | ✅ Done | — |
| T-038 | Egitmen dashboard (randevu, stok, hizli islemler) | 8 | ✅ Done | — |
| T-039 | Admin dashboard (stats API, haftalik rapor) | 8 | ✅ Done | Analytics Agent |
| T-040 | Guvenli mesajlasma sistemi (chat UI + API) | 8 | ✅ Done | — |
| T-041 | Bildirim merkezi UI (okundu/okunmadi) | 5 | ✅ Done | Notification Agent |
| T-042 | E-posta bildirim entegrasyonu (Resend/fallback) | 3 | ✅ Done | Notification Agent |
| T-043 | Hacamat sunnet gunleri otomatik isaretleme | 3 | ✅ Done | Calendar Agent |

**Sprint 5: 43/43 SP ✅ TAMAMLANDI**

#### Sprint 6 (Hafta 11-12): PWA & MVP Polish — 49 SP

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-044 | Service Worker + offline cache | 5 | ✅ Done | — |
| T-045 | PWA manifest + home screen install | 3 | ✅ Done | — |
| T-046 | Responsive design audit (mobil hamburger menu) | 8 | ✅ Done | — |
| T-047 | KVKK erisim loglari (audit trail + admin UI) | 5 | ✅ Done | Compliance Agent |
| T-048 | Guvenlik: rate limiting, session timeout, HTTPS | 5 | ✅ Done | — |
| T-049 | E2E test yazimi (Playwright) | 8 | ⬜ Backlog | — |
| T-050 | Performance optimization (Lighthouse 90+) | 5 | ⬜ Backlog | — |
| T-051 | Coolify production deploy (HTTPS canli) | 3 | ✅ Done | — |
| T-052 | User acceptance test (UAT) | 5 | 🔶 Kismi | — |
| T-053 | MVP launch checklist | 2 | 🔶 Kismi | — |

**Sprint 6: 34/49 SP (T-049 E2E test, T-050 Lighthouse eksik)**

---

### Phase 2 — Core Features (Hafta 13-24)

#### Sprint 7-8: Tedavi Protokolu & Operasyonel

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-054 | Tedavi protokolu motoru (coklu sikayet, oncelik) | 13 | ✅ Done | Clinical Agent |
| T-055 | Sikayet oncelik siralama UI | 5 | ✅ Done | Clinical Agent |
| T-062 | Kan degerleri gorsel (progress bar) | 5 | ✅ Done | Clinical Agent |
| T-083_inv | Stok/Envanter DB schema + API | 5 | ✅ Done | Inventory Agent |
| T-084_inv | Stok takip UI (liste, ekleme, tablo) | 8 | ✅ Done | Inventory Agent |
| T-085_inv | Minimum stok uyari sistemi (kritik bildirim) | 3 | ✅ Done | Inventory Agent |
| T-086_inv | Tedavi-stok otomatik dusum (usedItems) | 5 | ✅ Done | Inventory Agent |
| T-087_fin | Manuel odeme kaydi (nakit/kart/havale) | 5 | ✅ Done | Finance Agent |
| T-088_fin | Tedavi-odeme eslestirme | 3 | ✅ Done | Finance Agent |
| T-089_fin | Gunluk kasa raporu (API + UI) | 3 | ✅ Done | Finance Agent |
| T-090_emr | Acil durum raporlama butonu + form | 5 | ✅ Done | Emergency Agent |
| T-091_emr | Komplikasyon bildirim zinciri | 5 | ✅ Done | Emergency Agent |
| T-092_emr | Komplikasyon takip formu (24h/48h/1w) | 3 | ✅ Done | Emergency Agent |
| T-064 | Admin egitmen yonetimi (tam CRUD) | 8 | ✅ Done | — |
| T-065 | Admin danisan yonetimi + KVKK haklari (silme/export) | 8 | ✅ Done | Compliance Agent |
| T-066 | KVKK panosu (audit log viewer, checklist) | 8 | ✅ Done | Compliance Agent |
| T-095_ai | Kontrendikasyon otomatik eslestirme | 8 | ✅ Done | Clinical Agent |
| T-098 | Veri maskeleme (compliance agent'ta) | 3 | ✅ Done | Compliance Agent |
| T-100 | Egitmen arama + filtreleme (danisan tarafi) | 5 | ✅ Done | — |

#### Henuz Yapilmamis Phase 2 Task'leri

| Task ID | Task | SP | Durum | Agent |
|---------|------|----|-------|-------|
| T-056 | Oncesi/sonrasi karsilastirma (tedavi tab icinde) | 8 | ✅ Done | Clinical Agent |
| T-057 | Sesli not kayit (MediaRecorder API) | 5 | ⬜ Backlog | Media Agent |
| T-058 | Whisper STT entegrasyonu (Turkce) | 8 | ⬜ Backlog | Media Agent |
| T-059 | Transkript editor UI | 5 | ⬜ Backlog | Media Agent |
| T-060 | Gorsel annotation (canvas-based) | 8 | ⬜ Backlog | Media Agent |
| T-061 | EXIF metadata temizleme (JPEG/PNG) | 2 | ✅ Done | Media Agent |
| T-063 | Vucut bolgesi secimi (14 bolge dropdown) | 8 | ✅ Done | Clinical Agent |
| T-067 | Egitmen performans raporu (admin tablo) | 5 | ✅ Done | Analytics Agent |
| T-068 | Danisan ilerleme raporu (admin tablo) | 5 | ✅ Done | Analytics Agent |
| T-069 | Tedavi dagilim raporu (bar chart) | 5 | ✅ Done | Analytics Agent |
| T-070 | Yazdirilabilir rapor sayfasi (print CSS) | 5 | ✅ Done | Analytics Agent |
| T-071 | Toplu randevu + CSV export + filtre | 5 | ✅ Done | Booking Agent |
| T-072 | Tekrarlayan randevu olusturma (haftalik/aylik) | 5 | ✅ Done | Booking Agent |
| T-073 | Evolution API Coolify deploy | 5 | 🔶 Deploy edildi (degraded) | WhatsApp Agent |
| T-074-T-078 | WhatsApp entegrasyonu (5 task) | 34 | ⬜ Backlog | WhatsApp Agent |
| T-079-T-082 | Telegram bot (4 task) | 23 | ⬜ Backlog | Telegram Agent |
| T-093_ai | NER pipeline | 8 | 🔶 Kismi (keyword) | Clinical Agent |
| T-094_ai | Context-aware panel | 8 | ⬜ Backlog | Knowledge Agent |
| T-096_ai | Onam iptali operasyonel akis | 5 | ⬜ Backlog | Compliance Agent |
| T-097 | Offline ses kaydi + sync | 5 | ⬜ Backlog | Media Agent |
| T-099 | Admin toplu bildirim gonderimi (UI + API) | 5 | ✅ Done | Notification Agent |
| T-101 | Danisan geri bildirim formu (5 yildiz) | 3 | ✅ Done | Clinical Agent |
| T-102 | Sistem sagligi monitoring (Grafana) | 5 | 🔶 Grafana deploy edildi | — |
| T-103 | Penetrasyon testi | 8 | ⬜ Backlog | — |
| T-104 | Phase 2 regression test | 5 | ⬜ Backlog | — |

---

### Phase 3 — AI & Knowledge (Hafta 25-36) — TUMU BACKLOG

T-105 ile T-122 arasi tum task'ler (Qdrant, RAG, Claude API, Chatbot, Kulliyat) henuz baslanmamis.

---

## 3. Velocity Tracking

| Sprint | Planlanan SP | Tamamlanan SP | Velocity | Notlar |
|--------|-------------|---------------|----------|--------|
| Sprint 1 | 40 | 40 | 40 | ✅ TAMAMLANDI |
| Sprint 2 | 44 | 44 | 44 | ✅ TAMAMLANDI (MinIO + KVKK eklendi) |
| Sprint 3 | 52 | 47 | 47 | SMS + Push harici tamamlandi |
| Sprint 4 | 44 | 44 | 44 | ✅ TAMAMLANDI |
| Sprint 5 | 43 | 43 | 43 | ✅ TAMAMLANDI (Resend eklendi) |
| Sprint 6 | 49 | 37 | 37 | E2E test + Lighthouse kaldi |
| Faz 2 | ~200 | ~160 | ~160 | Stok, finans, acil, admin, KVKK, rapor, CSV, tekrar randevu |

**Toplam MVP: 255/272 SP (%93.7)**
**Toplam Faz 2: ~160/200 SP tamamlandi (%80)**
**Genel Ilerleme: ~415/472 SP (%88)**

---

## 4. Eksik Task Oncelik Sirasi

### ONCELIK 1 (MVP Tamamlama)
1. T-016: MinIO dosya yukleme servisi
2. T-042: Resend email entegrasyonu
3. T-049: E2E test (Playwright - en azindan kritik akislar)

### ONCELIK 2 (Production Kalite)
4. T-026: SMS bildirim (Netgsm)
5. T-027: Push notification (FCM)
6. T-028: Randevu hatirlati cron job
7. T-050: Lighthouse 90+

### ONCELIK 3 (Phase 2 Devam)
8. T-056: Oncesi/sonrasi split-view
9. T-070: PDF rapor ciktisi
10. T-071: Toplu randevu goruntuleme

### ONCELIK 4 (Phase 2 Ileri)
11-20: WhatsApp, Telegram, sesli not, gorsel annotation, vucut haritasi

### ONCELIK 5 (Phase 3 - AI)
21+: Qdrant RAG, Claude chatbot, kulliyat yonetimi

---

## 5. Mevcut Dosya Envanteri

### Backend (13 route, 16 schema, 8 agent, 2 middleware)
- Routes: auth, mfa, email-verify, danisan, egitmen, randevu, tedavi, stok, odeme, mesaj, acil, admin, protokol
- Schema: users, danisan, egitmen, randevu, musaitlik, tedavi, tahlil, mesaj, bildirim, stok, stok_hareket, odeme, komplikasyon, audit_log, kvkk_consent, protokol
- Agents: auth, booking, clinical, notification, calendar, compliance, emergency + base + index

### Frontend (33 sayfa, 7 UI component, 3 form component)
- Auth: giris, kayit (7 adim), dogrula, mfa, sifre-sifirla
- Danisan: dashboard, randevu, egitmen-ara, tedavi, tahlil, mesaj, profil
- Egitmen: dashboard, danisan (liste + [id] detay), randevu, tedavi, ajanda, musaitlik, stok, odeme, acil, protokol, profil
- Admin: dashboard, kullanicilar, egitmen, danisan, kvkk, sistem, raporlar
- Ortak: bildirim, ana sayfa

### Altyapi
- Coolify: 8 kaynak (PG, Redis, Grafana, Qdrant, MinIO, Evolution, FE, BE)
- HTTPS: Let's Encrypt SSL
- CI/CD: GitHub Actions
- PWA: Service Worker, manifest

---

## 6. Release Checklist — MVP

- [x] Tum Sprint 1-4 task'leri Done
- [x] Sprint 5-6 kritik task'ler Done
- [ ] E2E test suite (Playwright)
- [ ] Lighthouse >= 90
- [x] KVKK audit gecildi (consent, audit log, silme, export)
- [x] OWASP temel kontroller (rate limit, session timeout, HTTPS)
- [x] SSL sertifikasi aktif (Let's Encrypt)
- [x] Backup sistemi (PG daily)
- [x] Monitoring dashboard (Grafana)
- [x] PWA manifest + Service Worker
- [x] DNS ayarlari (sslip.io)
- [ ] Error tracking (Sentry)
- [x] Seed data (11 kullanici, 3 tedavi, stok, randevu)
- [x] Admin hesabi olusturuldu (turhanhamza@gmail.com)

---

*Bu dokuman ShifaHub projesi icin guncellenmis Proje Takip belgesidir.*
*Son Guncelleme: 8 Nisan 2026 | v2.0*

# ShifaHub — Proje Takip Dokümanı

**Project Tracking & Implementation Plan**

Versiyon: 1.0 | Tarih: 7 Nisan 2026 | Hazırlayan: Hamza Turhan

---

## 1. Proje Genel Bilgileri

| Alan | Değer |
|------|-------|
| Proje Adı | ShifaHub — Bütünsel Tedavi Yönetim Platformu |
| Proje Tipi | Web Application (PWA) — Full-Stack |
| Başlangıç Tarihi | Nisan 2026 |
| Hedef MVP Tarihi | Temmuz 2026 (12 hafta) |
| Hedef v1.0 Tarihi | Aralık 2026 |
| Deploy Ortamı | Coolify (self-hosted PaaS) |
| Geliştirme Modeli | Agentic Coding — Agent bazlı modüler geliştirme |
| Takım Modeli | Solo developer + AI agents (Claude Code + Slack entegrasyonu) |
| Repository | GitHub — Private Monorepo |

---

## 2. Sprint Planlaması

### Phase 1 — MVP (Hafta 1-12)

#### Sprint 1 (Hafta 1-2): Altyapı & Auth

**Hedef:** Proje iskeleti, CI/CD, authentication sistemi

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-001 | Monorepo kurulumu (Turborepo) | 3 | ⬜ Backlog | — |
| T-002 | Next.js 16 app scaffold | 3 | ⬜ Backlog | — |
| T-003 | PostgreSQL + Drizzle ORM schema tasarımı | 5 | ⬜ Backlog | Clinical Agent |
| T-004 | Auth sistemi: JWT + Refresh Token + MFA | 8 | ⬜ Backlog | Auth Agent |
| T-005 | RBAC (Danışan, Eğitmen, Admin rolleri) | 5 | ⬜ Backlog | Auth Agent |
| T-006 | KVKK açık rıza modülü (consent management) | 5 | ⬜ Backlog | Compliance Agent |
| T-007 | Coolify deploy pipeline | 3 | ⬜ Backlog | — |
| T-008 | Docker Compose (dev environment) | 3 | ⬜ Backlog | — |
| T-009 | ESLint + Prettier + Husky konfigürasyonu | 2 | ⬜ Backlog | — |
| T-010 | Temel UI component library (shadcn/ui) | 3 | ⬜ Backlog | — |

**Sprint Toplam:** 40 SP

#### Sprint 2 (Hafta 3-4): Kayıt & Profil

**Hedef:** Danışan ve eğitmen kayıt akışları

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-011 | Danışan kayıt wizard (multi-step form) | 8 | ⬜ Backlog | Auth Agent |
| T-012 | Anamnez formu (tüm alanlar) | 8 | ⬜ Backlog | Clinical Agent |
| T-013 | Eğitmen kayıt + sertifika yükleme | 5 | ⬜ Backlog | Auth Agent |
| T-014 | Admin eğitmen onay ekranı | 5 | ⬜ Backlog | Auth Agent |
| T-015 | Profil düzenleme ekranları (danışan + eğitmen) | 5 | ⬜ Backlog | — |
| T-016 | Dosya yükleme servisi (MinIO entegrasyonu) | 5 | ⬜ Backlog | Media Agent |
| T-017 | KVKK onam formu dijital imza akışı | 5 | ⬜ Backlog | Compliance Agent |
| T-018 | E-posta doğrulama + OTP | 3 | ⬜ Backlog | Notification Agent |

**Sprint Toplam:** 44 SP

#### Sprint 3 (Hafta 5-6): Randevu Sistemi

**Hedef:** Randevu alma, ajanda, hatırlatma

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-019 | Randevu DB schema + API | 5 | ⬜ Backlog | Booking Agent |
| T-020 | Eğitmen müsaitlik ayarları | 5 | ⬜ Backlog | Booking Agent |
| T-021 | Danışan randevu alma UI (takvim seçici) | 8 | ⬜ Backlog | Booking Agent |
| T-022 | Hicri takvim entegrasyonu (Umm al-Qura) | 5 | ⬜ Backlog | Calendar Agent |
| T-023 | Hicri/Miladi paralel gösterim UI | 5 | ⬜ Backlog | Calendar Agent |
| T-024 | Eğitmen ajanda — günlük/haftalık/aylık görünüm | 8 | ⬜ Backlog | Booking Agent |
| T-025 | Randevu durum akışı (state machine) | 5 | ⬜ Backlog | Booking Agent |
| T-026 | SMS bildirim entegrasyonu (Netgsm) | 3 | ⬜ Backlog | Notification Agent |
| T-027 | Push notification (FCM + PWA) | 5 | ⬜ Backlog | Notification Agent |
| T-028 | Randevu hatırlatma cron job (24h + 1h) | 3 | ⬜ Backlog | Notification Agent |

**Sprint Toplam:** 52 SP

#### Sprint 4 (Hafta 7-8): Tedavi Kaydı Temel

**Hedef:** Tedavi girişi, danışan dosyası, tahlil

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-029 | Tedavi kaydı DB schema + API | 5 | ⬜ Backlog | Clinical Agent |
| T-030 | Tedavi kayıt formu UI | 8 | ⬜ Backlog | Clinical Agent |
| T-031 | Danışan detay ekranı (tabbed layout) | 8 | ⬜ Backlog | Clinical Agent |
| T-032 | Tahlil yükleme + görüntüleme | 5 | ⬜ Backlog | Clinical Agent |
| T-033 | Kan değerleri giriş formu | 5 | ⬜ Backlog | Clinical Agent |
| T-034 | Danışan listesi (aranabilir, filtrelenebilir) | 5 | ⬜ Backlog | Clinical Agent |
| T-035 | Tedavi geçmişi timeline görünüm | 5 | ⬜ Backlog | Clinical Agent |
| T-036 | Eskiye dönük kayıt girişi | 3 | ⬜ Backlog | Clinical Agent |

**Sprint Toplam:** 44 SP

#### Sprint 5 (Hafta 9-10): Dashboard & Bildirim

**Hedef:** Danışan/Eğitmen/Admin dashboard'ları

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-037 | Danışan dashboard | 8 | ⬜ Backlog | — |
| T-038 | Eğitmen dashboard | 8 | ⬜ Backlog | — |
| T-039 | Admin dashboard (temel KPI kartları) | 8 | ⬜ Backlog | Analytics Agent |
| T-040 | Güvenli mesajlaşma sistemi | 8 | ⬜ Backlog | — |
| T-041 | Bildirim merkezi UI | 5 | ⬜ Backlog | Notification Agent |
| T-042 | E-posta bildirim entegrasyonu (Resend) | 3 | ⬜ Backlog | Notification Agent |
| T-043 | Hacamat sünnet günleri otomatik işaretleme | 3 | ⬜ Backlog | Calendar Agent |

**Sprint Toplam:** 43 SP

#### Sprint 6 (Hafta 11-12): PWA & MVP Polish

**Hedef:** PWA shell, test, bug fix, MVP release

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-044 | Service Worker + offline cache | 5 | ⬜ Backlog | — |
| T-045 | PWA manifest + home screen install | 3 | ⬜ Backlog | — |
| T-046 | Responsive design audit (tüm ekranlar) | 8 | ⬜ Backlog | — |
| T-047 | KVKK erişim logları (audit trail) | 5 | ⬜ Backlog | Compliance Agent |
| T-048 | Güvenlik audit (OWASP checklist) | 5 | ⬜ Backlog | — |
| T-049 | E2E test yazımı (Playwright) | 8 | ⬜ Backlog | — |
| T-050 | Performance optimization (Lighthouse 90+) | 5 | ⬜ Backlog | — |
| T-051 | Coolify production deploy | 3 | ⬜ Backlog | — |
| T-052 | User acceptance test (UAT) | 5 | ⬜ Backlog | — |
| T-053 | MVP launch checklist | 2 | ⬜ Backlog | — |

**Sprint Toplam:** 49 SP

---

### Phase 2 — Core Features (Hafta 13-24)

#### Sprint 7-8 (Hafta 13-16): Tedavi Protokolü & Multimedya

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-054 | Tedavi protokolü motoru (çoklu şikayet, öncelik) | 13 | ⬜ Backlog | Clinical Agent |
| T-055 | Şikayet öncelik sıralama UI (drag-drop) | 5 | ⬜ Backlog | Clinical Agent |
| T-056 | Öncesi/sonrası karşılaştırma (split-view) | 8 | ⬜ Backlog | Clinical Agent |
| T-057 | Sesli not kayıt (MediaRecorder API) | 5 | ⬜ Backlog | Media Agent |
| T-058 | Whisper STT entegrasyonu (Türkçe) | 8 | ⬜ Backlog | Media Agent |
| T-059 | Transkript editör UI | 5 | ⬜ Backlog | Media Agent |
| T-060 | Görsel annotation (canvas-based) | 8 | ⬜ Backlog | Media Agent |
| T-061 | EXIF metadata temizleme | 2 | ⬜ Backlog | Media Agent |
| T-062 | Kan değerleri grafik (Recharts) | 5 | ⬜ Backlog | Clinical Agent |
| T-063 | Vücut haritası işaretleme | 8 | ⬜ Backlog | Clinical Agent |

#### Sprint 9-10 (Hafta 17-20): Admin & Raporlama

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-064 | Admin eğitmen yönetimi (tam CRUD) | 8 | ⬜ Backlog | — |
| T-065 | Admin danışan yönetimi + KVKK hakları | 8 | ⬜ Backlog | Compliance Agent |
| T-066 | KVKK panosu (log viewer, rıza raporu) | 8 | ⬜ Backlog | Compliance Agent |
| T-067 | Eğitmen performans raporu | 5 | ⬜ Backlog | Analytics Agent |
| T-068 | Danışan ilerleme raporu | 5 | ⬜ Backlog | Analytics Agent |
| T-069 | Tedavi dağılım raporu | 5 | ⬜ Backlog | Analytics Agent |
| T-070 | PDF rapor çıktısı (React-PDF) | 5 | ⬜ Backlog | Analytics Agent |
| T-071 | Toplu randevu görüntüleme + export | 5 | ⬜ Backlog | Booking Agent |
| T-072 | Tekrarlayan randevu oluşturma | 5 | ⬜ Backlog | Booking Agent |

#### Sprint 11-12 (Hafta 21-24): WhatsApp, Telegram & Operasyonel Modüller

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-073 | Evolution API Coolify deploy + instance kurulumu | 5 | ⬜ Backlog | WhatsApp Agent |
| T-074 | WhatsApp webhook receiver + mesaj routing | 8 | ⬜ Backlog | WhatsApp Agent |
| T-075 | WhatsApp randevu hatırlatma mesajları (şablon) | 5 | ⬜ Backlog | WhatsApp Agent |
| T-076 | WhatsApp interactive buttons (onay/iptal) | 5 | ⬜ Backlog | WhatsApp Agent |
| T-077 | WhatsApp chatbot akışı (menü + AI RAG entegrasyonu) | 13 | ⬜ Backlog | WhatsApp Agent + Knowledge Agent |
| T-078 | WhatsApp KVKK opt-in/opt-out akışı | 3 | ⬜ Backlog | Compliance Agent |
| T-079 | Telegram Bot kurulumu (grammY framework) | 5 | ⬜ Backlog | Telegram Agent |
| T-080 | Telegram eğitmen komutları (/ajanda, /stok, /not) | 8 | ⬜ Backlog | Telegram Agent |
| T-081_tg | Telegram admin komutları (/durum, /komplikasyonlar) | 5 | ⬜ Backlog | Telegram Agent |
| T-082_tg | Telegram proaktif bildirimler (sabah ajanda, alert) | 5 | ⬜ Backlog | Telegram Agent |
| T-083_inv | Stok/Envanter DB schema + API | 5 | ⬜ Backlog | Inventory Agent |
| T-084_inv | Stok takip UI (malzeme listesi, ekleme, düşüm) | 8 | ⬜ Backlog | Inventory Agent |
| T-085_inv | Minimum stok uyarı sistemi | 3 | ⬜ Backlog | Inventory Agent |
| T-086_inv | Tedavi-stok otomatik düşüm bağlantısı | 5 | ⬜ Backlog | Inventory Agent |
| T-087_fin | Manuel ödeme kaydı (nakit/kart/havale) | 5 | ⬜ Backlog | Finance Agent |
| T-088_fin | Tedavi-ödeme eşleştirme | 3 | ⬜ Backlog | Finance Agent |
| T-089_fin | Günlük kasa raporu | 3 | ⬜ Backlog | Finance Agent |
| T-090_emr | Acil durum raporlama butonu + form | 5 | ⬜ Backlog | Emergency Agent |
| T-091_emr | Komplikasyon bildirim zinciri (admin + tabip + telegram) | 5 | ⬜ Backlog | Emergency Agent |
| T-092_emr | Komplikasyon takip formu (24h/48h/1 hafta) | 3 | ⬜ Backlog | Emergency Agent |
| T-093_ai | NER pipeline (hastalık, bitki, bölge tanıma) | 8 | ⬜ Backlog | Clinical Agent |
| T-094_ai | Context-aware sağ panel widget (real-time öneriler) | 8 | ⬜ Backlog | Knowledge Agent |
| T-095_ai | Kontrendikasyon otomatik eşleştirme motoru | 8 | ⬜ Backlog | Clinical Agent |
| T-096_ai | Onam iptali operasyonel akış (askıya alma + bildirim) | 5 | ⬜ Backlog | Compliance Agent |
| T-097 | Offline ses kaydı + sync | 5 | ⬜ Backlog | Media Agent |
| T-098 | Veri maskeleme (TC, telefon) | 3 | ⬜ Backlog | Compliance Agent |
| T-099 | Admin bildirim yönetimi (toplu gönderim) | 5 | ⬜ Backlog | Notification Agent |
| T-100 | Eğitmen arama + filtreleme (danışan tarafı) | 5 | ⬜ Backlog | — |
| T-101 | Danışan geri bildirim formu | 3 | ⬜ Backlog | Clinical Agent |
| T-102 | Sistem sağlığı monitoring (Grafana + Prometheus) | 5 | ⬜ Backlog | — |
| T-103 | Penetrasyon testi | 8 | ⬜ Backlog | — |
| T-104 | Phase 2 regression test | 5 | ⬜ Backlog | — |

---

### Phase 3 — AI & Knowledge (Hafta 25-36)

| Task ID | Task | Story Points | Durum | Agent |
|---------|------|-------------|-------|-------|
| T-105 | Vector DB kurulumu (Qdrant) | 5 | ⬜ Backlog | Knowledge Agent |
| T-106 | Kaynak ingestion pipeline (PDF/DOCX → chunk → embed) | 13 | ⬜ Backlog | Knowledge Agent |
| T-107 | RAG pipeline (query → retrieve → generate) | 13 | ⬜ Backlog | Knowledge Agent |
| T-108 | Claude API entegrasyonu (chatbot backend) | 8 | ⬜ Backlog | Knowledge Agent |
| T-109 | Chatbot UI — danışan versiyonu | 5 | ⬜ Backlog | Knowledge Agent |
| T-110 | Chatbot UI — eğitmen versiyonu (gelişmiş) | 8 | ⬜ Backlog | Knowledge Agent |
| T-111 | Kaynak referanslama (inline citation) | 5 | ⬜ Backlog | Knowledge Agent |
| T-112 | Admin külliyat yönetimi (kaynak CRUD + re-index) | 8 | ⬜ Backlog | Knowledge Agent |
| T-113 | Feragat notu sistemi | 2 | ⬜ Backlog | Knowledge Agent |
| T-114 | Chatbot analytics (soru logları, trend) | 5 | ⬜ Backlog | Analytics Agent |
| T-115 | Hadis külliyatı veri seti hazırlama | 8 | ⬜ Backlog | Knowledge Agent |
| T-116 | Tıbbi literatür veri seti hazırlama | 8 | ⬜ Backlog | Knowledge Agent |
| T-117 | Hallucination guard + safety filters | 5 | ⬜ Backlog | Knowledge Agent |
| T-118 | Conversation memory (seans içi bağlam) | 5 | ⬜ Backlog | Knowledge Agent |
| T-119 | WhatsApp chatbot → RAG entegrasyonu | 8 | ⬜ Backlog | WhatsApp Agent + Knowledge Agent |
| T-120 | Telegram → AI chatbot komut entegrasyonu | 5 | ⬜ Backlog | Telegram Agent + Knowledge Agent |
| T-121 | Anonimleştirilmiş tedavi başarı analizi motoru | 13 | ⬜ Backlog | Analytics Agent |
| T-122 | GETAT taksonomi katmanı (ICD-10 haritalaması) | 8 | ⬜ Backlog | Knowledge Agent |

---

## 3. Velocity Tracking

| Sprint | Planlanan SP | Tamamlanan SP | Velocity | Notlar |
|--------|-------------|---------------|----------|--------|
| Sprint 1 | 40 | — | — | — |
| Sprint 2 | 44 | — | — | — |
| Sprint 3 | 52 | — | — | — |
| Sprint 4 | 44 | — | — | — |
| Sprint 5 | 43 | — | — | — |
| Sprint 6 | 49 | — | — | — |

---

## 4. Bağımlılık Grafiği

```
T-001 (Monorepo) ──→ T-002 (Next.js) ──→ T-010 (UI Library)
                  ──→ T-003 (DB Schema) ──→ T-004 (Auth) ──→ T-011 (Danışan Kayıt)
                                                           ──→ T-013 (Eğitmen Kayıt)
                  ──→ T-007 (Coolify) ──→ T-051 (Prod Deploy)
                  ──→ T-008 (Docker)

T-004 (Auth) ──→ T-005 (RBAC) ──→ T-006 (KVKK Rıza)
             ──→ T-017 (Dijital İmza)

T-016 (MinIO) ──→ T-012 (Anamnez) ──→ T-032 (Tahlil)
              ──→ T-057 (Sesli Not) ──→ T-058 (Whisper STT)
              ──→ T-060 (Annotation)

T-019 (Randevu API) ──→ T-020 (Müsaitlik) ──→ T-021 (Randevu UI)
                    ──→ T-022 (Hicri) ──→ T-023 (Paralel Gösterim)
                    ──→ T-025 (State Machine) ──→ T-026 (SMS)
                                              ──→ T-028 (Cron)

T-029 (Tedavi API) ──→ T-030 (Tedavi Form) ──→ T-054 (Protokol Motoru)
                   ──→ T-031 (Danışan Detay) ──→ T-056 (Öncesi/Sonrası)
                   ──→ T-033 (Kan Değerleri) ──→ T-062 (Grafik)

T-081 (Qdrant) ──→ T-082 (Ingestion) ──→ T-083 (RAG) ──→ T-084 (Claude API)
                                                        ──→ T-085 (Chat UI Danışan)
                                                        ──→ T-086 (Chat UI Eğitmen)
```

---

## 5. Risk Register

| Risk ID | Risk | Olasılık | Etki | Sahip | Azaltma | Durum |
|---------|------|----------|------|-------|---------|-------|
| R-001 | KVKK ihlali — veri sızıntısı | Düşük | Kritik | Dev | Encryption, pentest, KVKK danışman | ⬜ Açık |
| R-002 | Whisper API Türkçe doğruluğu düşük | Orta | Orta | Dev | Alternatif STT araştır, fine-tune | ⬜ Açık |
| R-003 | Hicri takvim hesaplama hataları | Düşük | Yüksek | Dev | Umm al-Qura referans test seti | ⬜ Açık |
| R-004 | Coolify deploy sorunları | Orta | Orta | Dev | Docker Compose fallback | ⬜ Açık |
| R-005 | MinIO storage maliyeti büyümesi | Düşük | Düşük | Dev | Kompresyon, lifecycle policy | ⬜ Açık |
| R-006 | Eğitmen adoption düşüklüğü | Orta | Yüksek | Dev | UX testi, video eğitim, beta program | ⬜ Açık |
| R-007 | RAG chatbot hallucination | Orta | Yüksek | Dev | Guard rails, kaynak zorunluluğu, human review | ⬜ Açık |
| R-008 | Mevzuat değişikliği | Düşük | Orta | Dev | Modüler compliance modülü | ⬜ Açık |
| R-009 | Evolution API bağlantı kopması | Orta | Orta | Dev | Cloud API fallback, reconnect logic, monitoring | ⬜ Açık |
| R-010 | WhatsApp ban riski (Baileys) | Orta | Yüksek | Dev | Cloud API'ye geçiş planı, mesaj limitleri | ⬜ Açık |
| R-011 | Komplikasyon raporlama eksikliği | Düşük | Kritik | Dev | Zorunlu form, admin denetim | ⬜ Açık |
| R-012 | Stok takip uyumsuzluğu | Düşük | Düşük | Dev | Periyodik envanter sayımı özelliği | ⬜ Açık |

---

## 6. Definition of Done (DoD)

Her task için tamamlanma kriterleri:

- ✅ Kod yazıldı ve PR açıldı
- ✅ Unit test coverage ≥ 80%
- ✅ TypeScript strict mode — 0 hata
- ✅ Responsive test (320px-1440px)
- ✅ Lighthouse score ≥ 90 (Performance)
- ✅ KVKK kontrol listesi geçildi (ilgili task'lerde)
- ✅ Erişilebilirlik kontrolü (axe-core)
- ✅ PR review + merge to main
- ✅ Coolify staging deploy başarılı
- ✅ İlgili doküman güncellendi

---

## 7. Agent Görev Dağılımı Matrisi

| Agent | Sprint 1-2 | Sprint 3-4 | Sprint 5-6 | Sprint 7-10 | Sprint 11-12 |
|-------|-----------|-----------|-----------|------------|-------------|
| Auth Agent | T-004, T-005, T-011, T-013, T-014 | — | — | — | — |
| Booking Agent | — | T-019-T-025 | — | T-071, T-072 | — |
| Clinical Agent | T-003, T-012 | T-029-T-036 | — | T-054-T-056, T-062, T-063 | T-093_ai, T-095_ai |
| Media Agent | T-016 | — | — | T-057-T-061 | T-097 |
| Knowledge Agent | — | — | — | — | T-094_ai |
| Notification Agent | T-018 | T-026-T-028 | T-041, T-042 | — | T-099 |
| Analytics Agent | — | — | T-039 | T-067-T-070 | — |
| Calendar Agent | — | T-022, T-023 | T-043 | — | — |
| Compliance Agent | T-006, T-017 | — | T-047 | T-065, T-066 | T-078, T-096_ai, T-098 |
| **WhatsApp Agent** | — | — | — | — | T-073-T-077 |
| **Telegram Agent** | — | — | — | — | T-079-T-082_tg |
| **Inventory Agent** | — | — | — | — | T-083_inv-T-086_inv |
| **Finance Agent** | — | — | — | — | T-087_fin-T-089_fin |
| **Emergency Agent** | — | — | — | — | T-090_emr-T-092_emr |

---

## 8. Environment Matrix

| Ortam | URL | Branch | Deploy | Amaç |
|-------|-----|--------|--------|------|
| Local Dev | localhost:3000 | feature/* | Manuel | Geliştirme |
| Staging | staging.shifahub.app | develop | Auto (push) | Test & QA |
| Production | app.shifahub.app | main | Manuel (tag) | Canlı |

---

## 9. Daily Standup Template

```
📅 Tarih: ____
👤 Sprint: ____

✅ Dün tamamlanan:
- [ ] Task ID: _____ — Açıklama

🔄 Bugün planı:
- [ ] Task ID: _____ — Açıklama

🚫 Blocker:
- Varsa açıklama

📊 Sprint burndown: __/__ SP tamamlandı
```

---

## 10. Release Checklist — MVP

- [ ] Tüm Sprint 1-6 task'leri Done
- [ ] E2E test suite yeşil
- [ ] Lighthouse ≥ 90
- [ ] KVKK audit geçildi
- [ ] OWASP Top 10 kontrol
- [ ] SSL sertifikası aktif
- [ ] Backup sistemi çalışıyor
- [ ] Monitoring dashboard aktif
- [ ] KVKK aydınlatma metni yayında
- [ ] Kullanım koşulları yayında
- [ ] Gizlilik politikası yayında
- [ ] PWA manifest + icons
- [ ] DNS ayarları
- [ ] Error tracking (Sentry) aktif
- [ ] Analytics kurulu
- [ ] Seed data temizlendi
- [ ] Admin hesabı oluşturuldu
- [ ] Beta eğitmen davetleri gönderildi

---

## 11. Haftalık İlerleme Tablosu

| Hafta | Tarih | Sprint | Tamamlanan Task'ler | Toplam SP | Notlar |
|-------|-------|--------|---------------------|-----------|--------|
| 1 | — | Sprint 1 | — | — | — |
| 2 | — | Sprint 1 | — | — | — |
| 3 | — | Sprint 2 | — | — | — |
| 4 | — | Sprint 2 | — | — | — |
| 5 | — | Sprint 3 | — | — | — |
| 6 | — | Sprint 3 | — | — | — |
| 7 | — | Sprint 4 | — | — | — |
| 8 | — | Sprint 4 | — | — | — |
| 9 | — | Sprint 5 | — | — | — |
| 10 | — | Sprint 5 | — | — | — |
| 11 | — | Sprint 6 | — | — | — |
| 12 | — | Sprint 6 | — | — | — |

---

*Bu doküman ShifaHub projesi için hazırlanmış Proje Takip belgesidir.*

*© 2026 — Tüm hakları saklıdır.*

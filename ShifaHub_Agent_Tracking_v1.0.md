# ShifaHub Agent Tracking Document v1.0

> Son Guncelleme: 2026-04-08 09:30
> Durum: Sprint 1 Devam Ediyor (%60 tamamlandi)
> MVP Ilerlemesi: ~%15 (12 haftanin 1. haftasi)

---

## 1. Ajan Sistemi Genel Bakis

ShifaHub, 14 uzman ajandan olusan event-driven bir mimari kullanir. Her ajan kendi bounded context'inde (DDD) calisir ve BullMQ (Redis) uzerinden asenkron mesajlasma ile iletisim kurar.

### Mimari Diyagram
```
                    ┌─────────────────────────────────────┐
                    │           Event Bus (BullMQ/Redis)   │
                    └──────────┬──────────┬───────────────┘
                               │          │
    ┌──────────┬──────────┬────┴──────────┴────┬──────────┬──────────┐
    │          │          │                     │          │          │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐           ┌───┴───┐ ┌───┴───┐ ┌───┴───┐
│ Auth  │ │Booking│ │Clinical│           │ Media │ │Knowl. │ │Notif. │
│ Agent │ │ Agent │ │ Agent  │           │ Agent │ │ Agent │ │ Agent │
└───────┘ └───────┘ └────────┘           └───────┘ └───────┘ └───────┘

    ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
    │          │          │          │          │          │          │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐
│Analyt.│ │Calend.│ │Compli.│ │Whats. │ │Telegr.│ │Invent.│ │Financ.│
│ Agent │ │ Agent │ │ Agent │ │ Agent │ │ Agent │ │ Agent │ │ Agent │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘
                                                              ┌───────┐
                                                              │Emerge.│
                                                              │ Agent │
                                                              └───────┘
```

---

## 2. Ajan Detay Tablosu

| # | Ajan | Sprint | SP | Durum | Skill Dosyasi |
|---|------|--------|----|-------|---------------|
| 1 | Auth Agent | Sprint 1 | 40 | Backlog | `.claude/skills/auth-agent.md` |
| 2 | Booking Agent | Sprint 3 | 52 | Backlog | `.claude/skills/booking-agent.md` |
| 3 | Clinical Agent | Sprint 4 | 44 | Backlog | `.claude/skills/clinical-agent.md` |
| 4 | Media Agent | Sprint 2, 4 | 20 | Backlog | `.claude/skills/media-agent.md` |
| 5 | Knowledge Agent | Faz 3 | 60 | Backlog | `.claude/skills/knowledge-agent.md` |
| 6 | Notification Agent | Sprint 3, 5 | 30 | Backlog | `.claude/skills/notification-agent.md` |
| 7 | Analytics Agent | Sprint 5 | 25 | Backlog | `.claude/skills/analytics-agent.md` |
| 8 | Calendar Agent | Sprint 3 | 15 | Backlog | `.claude/skills/calendar-agent.md` |
| 9 | Compliance Agent | Sprint 1, 6 | 35 | Backlog | `.claude/skills/compliance-agent.md` |
| 10 | WhatsApp Agent | Faz 2 | 45 | Backlog | `.claude/skills/whatsapp-agent.md` |
| 11 | Telegram Agent | Faz 2 | 30 | Backlog | `.claude/skills/telegram-agent.md` |
| 12 | Inventory Agent | Faz 2 | 25 | Backlog | `.claude/skills/inventory-agent.md` |
| 13 | Finance Agent | Faz 2 | 20 | Backlog | `.claude/skills/finance-agent.md` |
| 14 | Emergency Agent | Faz 2 | 25 | Backlog | `.claude/skills/emergency-agent.md` |

---

## 3. Sprint Bazli Ajan Atamalari

### Sprint 1 (Hafta 1-2): Altyapi & Auth - 40 SP [TAMAMLANDI]
| Gorev | Ajan | SP | Durum |
|-------|------|----|-------|
| Monorepo kurulumu (Turborepo) | - | 5 | DONE |
| Next.js 16 scaffold | - | 5 | DONE |
| PostgreSQL schema (Drizzle) | - | 8 | DONE |
| JWT + MFA auth sistemi | Auth Agent | 8 | DONE |
| RBAC (4 rol) | Auth Agent | 5 | DONE |
| KVKK consent modulu | Compliance Agent | 5 | DONE |
| Coolify CI/CD pipeline | - | 3 | DONE |
| Docker Compose (dev) | - | 3 | DONE |
| ESLint + Prettier + Husky | - | 2 | DONE |
| shadcn/ui component library | - | 3 | DONE |

### Sprint 2 (Hafta 3-4): Kayit & Profil - 44 SP [DEVAM EDIYOR %70]
| Gorev | Ajan | SP | Durum |
|-------|------|----|-------|
| Danisan kayit wizard (4 adim) | Auth Agent | 8 | DONE |
| Kapsamli anamnez formu | Clinical Agent | 8 | DONE |
| Egitmen kayit + sertifika yukleme | Auth Agent | 5 | DONE |
| Admin onay akisi | Auth Agent | 5 | DONE (Sprint 1) |
| Profil duzenleme | Auth Agent | 3 | DONE |
| MinIO dosya yukleme | Media Agent | 5 | Backlog |
| Dijital imza akisi | Compliance Agent | 5 | Backlog |
| Email dogrulama + OTP | Notification Agent | 5 | DONE (Sprint 1) |

### Sprint 3 (Hafta 5-6): Randevu Sistemi - 52 SP [DEVAM EDIYOR %70]
| Gorev | Ajan | SP | Durum |
|-------|------|----|-------|
| Randevu DB + API | Booking Agent | 8 | DONE |
| Egitmen musaitlik ayarlari | Booking Agent | 5 | DONE |
| Danisan randevu alma UI | Booking Agent | 8 | DONE |
| Hicri takvim entegrasyonu | Calendar Agent | 8 | DONE |
| Paralel Hicri/Miladi gosterim | Calendar Agent | 5 | DONE |
| Takvim gorunumleri (gun/hafta/ay) | Booking Agent | 5 | DONE |
| Randevu state machine | Booking Agent | 3 | DONE |
| SMS hatirlati (Netgsm) | Notification Agent | 5 | Backlog |
| FCM push bildirimi | Notification Agent | 3 | Backlog |
| Otomatik cron hatirlati (24h+1h) | Notification Agent | 2 | Backlog |

### Sprint 4 (Hafta 7-8): Tedavi Kayitlari - 44 SP [DEVAM EDIYOR %75]
| Gorev | Ajan | SP | Durum |
|-------|------|----|-------|
| Tedavi kaydi schema + API | Clinical Agent | 8 | DONE |
| Tedavi form UI | Clinical Agent | 8 | DONE |
| Danisan detay ekrani (sekmeli) | Clinical Agent | 5 | DONE |
| Tahlil yukleme + gosterim | Media Agent | 5 | DONE |
| Kan degerleri formu | Clinical Agent | 5 | Backlog |
| Aranabilir danisan listesi | Clinical Agent | 3 | Backlog |
| Tedavi gecmisi timeline | Clinical Agent | 5 | DONE |
| Gecmise donuk kayit | Clinical Agent | 5 | DONE |

### Sprint 5 (Hafta 9-10): Dashboard & Mesajlasma - 43 SP
| Gorev | Ajan | SP | Durum |
|-------|------|----|-------|
| Danisan dashboard | Analytics Agent | 8 | Backlog |
| Egitmen dashboard | Analytics Agent | 8 | Backlog |
| Admin dashboard | Analytics Agent | 8 | Backlog |
| Guvenli mesajlasma sistemi | - | 8 | Backlog |
| Bildirim merkezi | Notification Agent | 5 | Backlog |
| Email entegrasyonu (Resend) | Notification Agent | 3 | Backlog |
| Hicri ozel gunler otomatik isaretleme | Calendar Agent | 3 | Backlog |

### Sprint 6 (Hafta 11-12): PWA & Polish - 49 SP
| Gorev | Ajan | SP | Durum |
|-------|------|----|-------|
| Service Worker + offline cache | - | 8 | Backlog |
| PWA manifest | - | 3 | Backlog |
| Responsive denetim (320-1440px) | - | 5 | Backlog |
| KVKK audit log kontrolu | Compliance Agent | 5 | Backlog |
| Guvenlik denetimi (OWASP) | Compliance Agent | 5 | Backlog |
| E2E testler (Playwright) | - | 8 | Backlog |
| Performans (Lighthouse 90+) | - | 5 | Backlog |
| Coolify production deploy | - | 5 | Backlog |
| UAT (Kullanici kabul testi) | - | 3 | Backlog |
| MVP kontrol listesi | - | 2 | Backlog |

---

## 4. Ajan Arasi Iletisim Matrisi

```
               Auth  Book  Clin  Med   Know  Noti  Anal  Cal   Comp  WA    TG    Inv   Fin   Emrg
Auth            -     -     -     -     -     x     -     -     x     -     -     -     -     -
Booking         x     -     -     -     -     x     -     x     -     x     -     -     -     -
Clinical        -     -     -     x     x     -     -     -     x     -     -     x     -     -
Media           -     -     x     -     -     -     -     -     -     -     -     -     -     -
Knowledge       -     -     x     -     -     -     -     -     -     x     -     -     -     -
Notification    -     x     -     -     -     -     -     -     -     -     -     -     -     x
Analytics       -     -     -     -     x     -     -     -     -     -     -     -     -     -
Calendar        -     x     -     -     -     x     -     -     -     -     -     -     -     -
Compliance      x     -     x     -     -     -     -     -     -     -     -     -     -     -
WhatsApp        -     x     -     -     x     x     -     -     -     -     -     -     -     -
Telegram        -     -     -     -     -     x     -     -     -     -     -     x     -     x
Inventory       -     -     x     -     -     x     -     -     -     -     x     -     -     -
Finance         -     -     x     -     -     -     x     -     -     -     -     -     -     -
Emergency       -     -     x     -     -     x     -     -     -     -     x     -     -     -
```

x = Mesaj gonderir (satir -> sutun)

---

## 5. Event Tipleri Katalogu

### Auth Events
- `USER_REGISTER` | `USER_LOGIN` | `MFA_VERIFY` | `SESSION_REFRESH` | `CONSENT_UPDATE` | `PASSWORD_RESET`

### Booking Events
- `APPOINTMENT_CREATED` | `APPOINTMENT_CONFIRMED` | `APPOINTMENT_CANCELLED` | `APPOINTMENT_REMINDED`
- `APPOINTMENT_ARRIVED` | `APPOINTMENT_COMPLETED` | `APPOINTMENT_NO_SHOW`

### Clinical Events
- `TREATMENT_CREATED` | `TREATMENT_UPDATED` | `LAB_RESULT_ADDED` | `LAB_RESULT_ALERT`
- `NER_EXTRACTED` | `CONTRAINDICATION_ALERT`

### Media Events
- `FILE_UPLOADED` | `FILE_PROCESSED` | `STT_COMPLETED` | `STT_FAILED` | `ANNOTATION_SAVED`

### Knowledge Events
- `QUERY_RECEIVED` | `RETRIEVAL_COMPLETED` | `RESPONSE_GENERATED`
- `SOURCE_INGESTED` | `SOURCE_EMBEDDED` | `REINDEX_REQUESTED`

### Notification Events
- `NOTIFICATION_SEND` | `NOTIFICATION_DELIVERED` | `NOTIFICATION_FAILED` | `NOTIFICATION_READ`
- `REMINDER_SCHEDULED` | `REMINDER_TRIGGERED`

### Compliance Events
- `DATA_ACCESSED` | `DATA_MODIFIED` | `DATA_DELETED`
- `CONSENT_GRANTED` | `CONSENT_REVOKED` | `BREACH_DETECTED`

### WhatsApp Events
- `WA_MESSAGE_RECEIVED` | `WA_MESSAGE_SENT` | `WA_MESSAGE_DELIVERED`
- `WA_CONNECTION_LOST` | `WA_QR_GENERATED`

### Telegram Events
- `TG_COMMAND_RECEIVED` | `TG_NOTIFICATION_SENT` | `TG_PROACTIVE_TRIGGERED`

### Inventory Events
- `STOCK_ADDED` | `STOCK_DEDUCTED` | `STOCK_LOW_ALERT` | `STOCK_EXPIRED_ALERT`

### Finance Events
- `PAYMENT_RECORDED` | `PAYMENT_UPDATED` | `DAILY_REPORT_GENERATED`

### Emergency Events
- `COMPLICATION_REPORTED` | `EMERGENCY_CHAIN_TRIGGERED`
- `FOLLOWUP_DUE` | `FOLLOWUP_COMPLETED` | `EMERGENCY_RESOLVED`

### Calendar Events
- `SUNNAH_DAY_APPROACHING` | `SPECIAL_DAY_REMINDER` | `CALENDAR_SYNC`

### Analytics Events
- `REPORT_REQUESTED` | `REPORT_GENERATED` | `METRICS_CALCULATED`

---

## 6. Ilerleme Takip Tablosu

| Hafta | Tarih | Sprint | Planlanan SP | Tamamlanan SP | Velocity | Notlar |
|-------|-------|--------|-------------|---------------|----------|--------|
| 0 | 2026-04-08 | Faz 0 | - | - | - | Dokumantasyon + Altyapi kurulumu tamamlandi |
| 1 | 2026-04-08 | Sprint 1 | 20 | 40 | 40 | Sprint 1 TAMAMLANDI - Auth, MFA, RBAC, email verify - 7 commit |
| 2 | - | Sprint 1 | 20 | - | - | - |
| 3 | - | Sprint 2 | 22 | - | - | - |
| 4 | - | Sprint 2 | 22 | - | - | - |
| 5 | - | Sprint 3 | 26 | - | - | - |
| 6 | - | Sprint 3 | 26 | - | - | - |
| 7 | - | Sprint 4 | 22 | - | - | - |
| 8 | - | Sprint 4 | 22 | - | - | - |
| 9 | - | Sprint 5 | 22 | - | - | - |
| 10 | - | Sprint 5 | 21 | - | - | - |
| 11 | - | Sprint 6 | 25 | - | - | - |
| 12 | - | Sprint 6 | 24 | - | - | - |

---

## 7. Altyapi Servisleri Durum Tablosu

| Servis | Coolify UUID | Durum | Port | Tip |
|--------|-------------|-------|------|-----|
| PostgreSQL 17 | k4k3p9z5pc4mvz65gs3c9p5r | running:healthy | 5432 | database |
| Redis 8 | a21pv073dua829h7ber767mo | running:healthy | 6379 | database |
| MinIO | owihjqc7uv84lxaivtkb8x13 | deploying | 9000/9001 | application |
| Qdrant | uofpc8pob54jxyboli5brilh | restarting | 6333 | service |
| Evolution API | gq3wsvvj5480gmyth5629tob | restarting | 8080 | service |
| Grafana | i72m1nqoqpwvkvoqehmhqxeu | running:healthy | 3000 | service |
| Frontend | q9rqagsabejx6y4sx7c9mzot | created | 3000 | application (git) |
| Backend | sjqd2i13xbafofo81pkbzclq | created | 4000 | application (git) |

---

## 8. Risk Takibi

| Risk | Olasilik | Etki | Azaltma | Durum |
|------|----------|------|---------|-------|
| KVKK veri ihlali | Dusuk | Kritik | Sifreleme + pentest | Izleniyor |
| Whisper Turkce dogruluk | Orta | Yuksek | Alternatif STT | Arastirilacak |
| Hicri takvim hesaplama hatasi | Dusuk | Orta | Umm al-Qura referans test | Plan |
| Coolify deploy hatasi | Dusuk | Yuksek | Docker Compose fallback | Izleniyor |
| Evolution API WhatsApp kopma | Orta | Orta | Cloud API fallback + reconnect | Plan |
| Dusuk egitmen benimseme | Orta | Yuksek | UX testi + video egitim + beta | Plan |
| RAG chatbot halusilasyon | Orta | Yuksek | Guard rails + kaynak zorunlulugu | Plan |
| Mevzuat degisikligi | Dusuk | Orta | Moduler compliance modulu | Plan |
| VPS kaynak yetersizligi | Dusuk | Yuksek | Dikey olcekleme + monitoring | Izleniyor |
| API maliyet asimi | Dusuk | Orta | Rate limiting + cache | Plan |
| Tek gelistirici bagimliligi | Yuksek | Yuksek | Dokumantasyon + ajan sistemi | Aktif |
| Veri kaybi | Dusuk | Kritik | Gunluk yedekleme + test | Plan |

---

## 9. Haftalik Ilerleme Notlari

### Hafta 0 - 2026-04-08
**Tamamlanan:**
- PRD v1.0 dokumani hazirlandi (1092 satir)
- Tech Stack v1.0 dokumani hazirlandi (852 satir)
- Project Tracking v1.0 dokumani hazirlandi (409 satir)
- Claude Code ajan sistemi kuruldu:
  - `.claude/settings.json` - izin konfigurasyonu
  - 16 skill dosyasi (14 ajan + deploy + db-migrate)
  - Her skill dosyasinda: sorumluluklar, event tipleri, anahtar dosyalar, test plani
- Proje hafiza sistemi kuruldu:
  - `memory/MEMORY.md` - indeks dosyasi (8 referans)
  - `memory/project_context.md` - proje baglamı
  - `memory/tech_stack.md` - mimari kararlar
  - `memory/credentials_reference.md` - servis credential bilgileri
  - `memory/project_rules.md` - kodlama standartlari
  - `memory/deployment_config.md` - Coolify ve deploy bilgileri
  - `memory/agent_system.md` - 14 ajan mimarisi
  - `memory/project_status.md` - ilerleme takibi
  - `memory/user_profile.md` - kullanici profili
- CLAUDE.md proje kurallar dosyasi olusturuldu
- Agent Tracking v1.0 dokumani olusturuldu (bu dosya)

### Hafta 1 (Sprint 1) - 2026-04-08
**Tamamlanan:**
- Coolify'da ShifaHub projesi olusturuldu (8 kaynak: 2 DB, 3 service, 3 app)
- PostgreSQL 17 + Redis 8 running:healthy
- Grafana + Qdrant running:healthy
- MinIO + Evolution API configuring/degraded (calisma devam ediyor)
- Git repo: github.com/elkekoitan/shifaHub.git (5 commit)
- Turborepo monorepo scaffold (apps/web, apps/api, packages/*)
- npm install (410+ paket)
- ESLint 10 + Prettier + Husky pre-commit
- shadcn/ui: Button, Input, Label, Card, Sidebar componentleri
- Tailwind CSS 4 tema (teal primary, CSS variables)
- /giris sayfasi (email/sifre login formu)
- /kayit sayfasi (2 adimli wizard + KVKK onay)
- Dashboard layout (sidebar + 3 rol navigasyonu)
- Danisan/Egitmen/Admin dashboard sayfalari
- DB schema: users, danisan, egitmen, audit_log, kvkk_consent (Drizzle ORM)
- JWT Auth API: register, login, refresh, me (Argon2 + jose)
- RBAC middleware: requireAuth, requireRole (4 rol)
- Audit middleware: KVKK uyumlu log helper
- AuthAgent class: BaseAgent extend, JWT/Argon2/KVKK methods
- Danisan API: profil CRUD, egitmen icin liste
- Admin API: egitmen onay/red akisi
- Coolify frontend + backend GitHub entegrasyonu

**Sprint 1 Kalan:**
- MFA (TOTP - otpauth)
- Email dogrulama (Resend)
- Sifre sifirlama akisi
- Ilk production deploy testi

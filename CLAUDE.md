# ShifaHub - Butunsel Tedavi Yonetim Platformu

## Proje Yapisi (Planlanan Monorepo)
```
shifahub/
  apps/web/          # Next.js 16 frontend (PWA)
  apps/api/          # Fastify 5 backend (tRPC, agents)
  packages/shared/   # Ortak tipler, sabitler, utility
  packages/ui/       # Ortak UI componentleri
  packages/config/   # ESLint, TS, Tailwind config
  docs/              # PRD, Tech Stack, Tracking dokumanlari
```

## Hizli Komutlar
```bash
npm run dev          # Turborepo ile tum uygulamalar
npm run build        # Production build
npm run test         # Vitest unit + integration
npm run lint         # ESLint
npm run typecheck    # TypeScript strict kontrol
npm run e2e          # Playwright E2E testler
cd apps/api && npx drizzle-kit push   # DB migration
```

## Deployment
- **Coolify Dashboard:** http://185.255.95.111:8000
- **Staging:** develop branch -> auto deploy
- **Production:** git tag (vX.Y.Z) -> manual deploy
- **Domains:** app.shifahub.app | api.shifahub.app | wa.shifahub.app | monitor.shifahub.app

## Mimari Kurallar
- **Agent-based architecture:** 14 uzman ajan (Auth, Booking, Clinical, Media, Knowledge, Notification, Analytics, Calendar, Compliance, WhatsApp, Telegram, Inventory, Finance, Emergency)
- **TypeScript strict mode** zorunlu
- **tRPC 11** end-to-end type safety
- **Drizzle ORM** (ASLA Prisma kullanilmaz)
- **RLS** (Row-Level Security) tum hasta/danisan verileri icin zorunlu
- **KVKK encryption:** pgcrypto AES-256 ile TC/telefon/saglik verisi sifreleme
- **zustand** client state, **@tanstack/react-query** server state
- **react-hook-form + zod** form validation
- **shadcn/ui** UI component library

## Turkce Route Isimleri
giris, kayit, randevu, tedavi, danisan, egitmen, ajanda, tahlil, stok, odeme, bildirim, ayarlar, kvkk, acil

## Terminoloji UYARISI
- ASLA "doktor" kelimesi kullanilmaz -> "Egitmen", "Uygulama Uzmani"
- ASLA "hasta" kelimesi kullanilmaz -> "Danisan"
- GETAT = Geleneksel ve Tamamlayici Tip
- Hicri takvim: Umm al-Qura algoritmasi (Intl.DateTimeFormat)
- Hacamat sunnet gunleri: Hicri ayin 17, 19, 21. gunleri

## Agent Sistemi
14 uzman ajan, event-driven mimari (BullMQ/Redis):
- Her ajan kendi bounded context'inde calisir (DDD)
- BaseAgent abstract class: `apps/api/agents/base-agent.ts`
- Event bus: BullMQ (Redis) message queue
- Skill dosyalari: `.claude/skills/` dizininde

## KVKK Kurallari
- Saglik verileri = ozel nitelikli kisisel veri (en yuksek koruma)
- Her veri isleme amaci icin ayri acik riza
- Audit log: her veri erisiminde kayit (`audit_log` tablosu)
- TC kimlik: pgcrypto AES-256 ile sifreleme
- Telefon: Son 4 hane UI'da, tam numara DB'de sifreli
- Veri saklama: saglik verisi 20-30 yil retention

## Commit Kurallari
- Turkce commit mesajlari tercih edilir
- Conventional commits: feat:, fix:, docs:, chore:, refactor:, test:
- Feature branch: `claude/[ozellik-adi]`
- Her commit oncesi `npm run build` basarili olmali

## Tech Stack Ozet
- Frontend: Next.js 16 + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui
- Backend: Node.js 22 + Fastify 5 + tRPC 11 + Drizzle ORM + BullMQ + Socket.io
- Database: PostgreSQL 17 + Redis 8 + MinIO + Qdrant
- AI: Claude API + OpenAI Whisper + text-embedding-3-small
- Messaging: Evolution API (WhatsApp) + grammy (Telegram) + Netgsm (SMS) + Resend (Email)
- Infrastructure: Coolify + Docker + Traefik + GitHub Actions

# ShifaHub — Rewrite Log (canlı)

> Onaylı plan: `~/.claude/plans/dvm-zippy-snail.md` · Hafıza: [[rewrite-program]]
> Branch: `rewrite` (orphan) · `develop`/`main` = eski referans (dokunulmuyor)
> Yedek: `shifahub-backup-pre-rewrite-2026-06-13.bundle` + `archive/pre-rewrite-v8`

Bu günlük her fazda güncellenir (Obsidian uyumlu, `[[wikilink]]`).

---

## P1 — Monorepo scaffold + interop ✅ `b77c5f3`

- Paketler: `@shifahub/{config,db,trpc,shared,ui}`
- Fastify 5 + `fastifyTRPCPlugin` host; `AppRouter` tipi `packages/trpc`'de
- **Kanıt:** `health.check → { ok:true, db:true }` (type-safe istemci → tRPC → Fastify → Drizzle → PG)
- Risk bertaraf: tRPC 11 + Fastify 5 interop

## P2 — DB + KVKK uyum çekirdeği ✅ `b473c5f` + test

- [x] `_shared.ts` (bytea, timestamps), `crypto.ts` (pgcrypto encrypt/decrypt), `rls.ts` (setSessionContext)
- [x] `users.ts` kanonik şema (encrypted PII + phoneLast4)
- [x] 14 şema çok-ajanlı Workflow ile portlandı (boolean düzeltmeleri, bytea, timestamps) — 18 tablo
- [x] `care_relationship` tablosu (RLS ilişki-kapısı)
- [x] schema barrel + `drizzle-kit generate` (0000 DDL, commit'li migration)
- [x] el yazımı `0001_enable_rls.sql` (pgcrypto + non-superuser `shifahub_app` + ENABLE/FORCE RLS + 12 tablo politikası)
- [x] **Entegrasyon testi PostgreSQL 18.4 (embedded, yerel) — 8/8 GEÇTİ:** şifreli round-trip + ciphertext-at-rest + yanlış-anahtar reddi; RLS cross-tenant red; care-relationship gating; audit_log append-only
- Not: canlı DB'ye DOKUNULMADI; test izole embedded Postgres ile (no Docker)

## P3 — Backend (tRPC routerlar, context, servisler) 🔄 `6f0b4d2` `d0cab8e`

- [x] withRls tx middleware (SET LOCAL ROLE shifahub_app + GUC) — her resolver RLS-enforced
- [x] auth router (register/login/me/refresh, argon2id + jose) — **5/5 test**
- [x] 17 router merge (auth, health + 15 domain çok-ajanlı port): danışan, eğitmen, randevu,
      tedavi, tahlil, stok, ödeme, bildirim, mesaj, protokol, müsaitlik, komplikasyon, acil, admin, kvkk
- [x] randevu state machine + Hicri/sünnet + çift-rezervasyon (SECURITY DEFINER fix) — **3/3 test**
- [x] kvkk: consent grant/revoke/check + veri sahibi hakları (export/erasure) + audit log okuma (admin)
- [ ] KALAN: consent-gate enforcement (health write'larda), MinIO upload/media router, BullMQ reminder worker
      (Redis/MinIO gerektirir — P5 altyapısıyla birlikte)
- Toplam P1-P3: **7 commit, 16 geçen entegrasyon testi**, typecheck temiz

## P4 — Frontend + Shifa Ether (design-guru skill) 🔄

- [x] **design-guru** ile Shifa Ether v2 tasarım dili sentezlendi (token/tipografi/bileşen/dark mode)
- [x] `packages/ui/src/styles/globals.css` — tek kaynak token sistemi (emerald ramp, sage nötr,
      bal aksan, semantic -bg/-fg/-border, marka-tonlu gölge, focus-ring, motion, **theme-color #306a4f fix**)
- [x] tasarım dili hafızaya yazıldı (`design_language.md`) + mockup ile doğrulandı (giriş + danışan dashboard)
- [x] web app foundation (Next 16, tRPC client + react-query + zustand + rhf/zod) — `2a29b17`
- [x] **39 route build YEŞİL** (`700d571`): auth(5) + danışan(9) + eğitmen(14) + admin(10) + shared(1); çok-ajanlı fan-out
- [x] PWA manifest theme-color emerald fix
- [ ] kalan polish: service worker güncelleme, ikon üretimi (design-guru), a11y/Lighthouse denetimi

## P5 — Ajanlar + entegrasyonlar (14 ajan, Külliyat AI) ⏳

## P6 — Test sertleştirme ⏳

## P7 — Coolify v2 deploy + parite + cutover 🔄

- [x] `rewrite` branch GitHub'a push (develop/main dokunulmadı); monorepo-aware Dockerfile'lar
- [x] **shifahub-postgres-v2** (PG17, izole) + **shifahub-backend-v2** (Coolify, Dockerfile, rewrite branch)
- [x] api boot'ta otomatik migrate + demo seed; HTTPS (Let's Encrypt sslip.io)
- [x] **BACKEND CANLI:** `https://ufx752pb2tk8uft3t86umoeo.185.255.95.111.sslip.io`
      → /health ✓, demo login (danışan/admin) ✓ — RLS+pgcrypto+JWT production'da çalışıyor
- [ ] **shifahub-frontend-v2** deploy (devam ediyor): `https://fn7lemtkwwvj3r8myn2wgqk4.185.255.95.111.sslip.io`
- [ ] cutover (gerçek domain) + eski sistem tampon
- Demo: turhanhamza@gmail.com/admin123, demo.egitmen@shifahub.app/egitmen123, demo.danisan@shifahub.app/danisan123
- **Eski sistem (shifahub-backend/frontend/postgres/redis) EL DEĞMEDEN çalışıyor** (blue/green)

## P8 — Teardown (geri dönüşsüz, en son) ⏳

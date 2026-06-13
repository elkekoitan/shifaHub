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

## P3 — Backend (tRPC routerlar, context, servisler) ⏳

## P4 — Frontend + Shifa Ether (design-guru skill) ⏳

## P5 — Ajanlar + entegrasyonlar (14 ajan, Külliyat AI) ⏳

## P6 — Test sertleştirme ⏳

## P7 — Coolify v2 deploy + parite + cutover ⏳

## P8 — Teardown (geri dönüşsüz, en son) ⏳

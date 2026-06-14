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

## P5 — Ajanlar + entegrasyonlar (14 ajan, Külliyat AI) 🔄

- [x] **Külliyat AI CANLI** — OpenRouter ücretsiz model + **fallback routing**; `packages/trpc/src/lib/ai.ts`
      Zincir: `nex-agi/nex-n2-pro:free` (~2sn) → `nemotron-nano-omni-30b:free` → `owl-alpha`. Model
      yanıt vermezse (HTTP/timeout/boş/geçersiz-JSON/429) sonrakine geçer. (550B-ultra elendi: >120sn)
- [x] Çoklu-ajan adversarial review (4 lens) → 8 düzeltme: klinik NER sessiz-boş dönmez (JSON modu+
      doğrulama+fırlat), NaN-timeout guard, reasoning_content okuma, istemciye genel mesaj (upstream
      sızmaz), toplam-süre bütçesi + 429 kısa-devre + zincir dedupe + opts.models override
- [x] `kulliyat` router: `ask` (GETAT bilgi Q&A, protected) + `analyzeComplaints` (eğitmen, anamnez→JSON NER)
- [x] GETAT system prompt: terminoloji (asla doktor/hasta), sünnet günleri 17/19/21, teşhis koymaz
- [x] Danışan **Külliyat chat sayfası** (`/danisan/kulliyat`) + alt nav'a eklendi — HTTP 200
- [x] **Eğitmen AI anamnez** — tedavi sihirbazı Adım 2'ye `analyzeComplaints` bağlandı (serbest şikayet
      → şikayet/kronik/alerji/ilaç/önerilen-yöntem chip'leri; JSON modu + güvenilir alt zincir);
      "şikayetleri bulgulara ekle" kısayolu
- [x] **Canlı uçtan uca test:** danışan girişi → "sülük kimlere uygulanmaz" → doğru, kontrendikasyonlu
      GETAT yanıtı (hemofili/anemi/kan sulandırıcı/hamile) OpenRouter'dan döndü
- [x] api Coolify env: OPENROUTER_API_KEY + OPENROUTER_MODEL set
- [ ] kalan ajanlar: WhatsApp(Evolution)/Telegram(grammy)/SMS(Netgsm)/e-posta(Resend) — **anahtar bekliyor**
- [ ] Qdrant vektör DB + embeddings (knowledge base), Whisper anamnez, online ödeme (Finance)

## P3 — Backend (devam: hatırlatma worker) 🔄

- [x] **BullMQ randevu hatırlatma worker'ı** (`apps/api/src/workers/reminders.worker.ts`) — Redis v2;
      10 dk'da bir tarar, 24h/1h içindeki randevulara `bildirim` üretir, reminder_24h/1h_sent işaretler
- [x] server.ts boot'ta fire-and-forget başlatma (REDIS_URL varsa); Redis hatası API'yi düşürmez
- [x] api Coolify env: REDIS_URL (Redis v2 internal) set
- [x] **KVKK consent-gate** — `tedavi.create` + `tahlil.create` artık danışanın aktif
      `saglik_verisi_isleme` açık rızası yoksa FORBIDDEN döner. `user_has_active_consent`
      SECURITY DEFINER fonksiyonu (0002 migration; RLS eğitmenden rıza satırını gizler, fn
      yalnızca boolean döner). seed: demo danışana idempotent rıza backfill. Test: 11/11 geçti.
- [~] **MinIO dosya yükleme — KOD TAM + CANLI, backend cred-blocked.** `lib/storage.ts` (minio client) +
  `routes/upload.ts` (POST /upload multipart + GET /uploads + GET /uploads/file, JWT auth, kullanıcı
  önekine izole, hepsi api proxy, list graceful). Web: danışan `/danisan/belgeler` (yükle/listele/blob) + profil kısayolu — HTTP 200 canlı. MinIO servisi Coolify'a provision edildi (`zcm49e0git15pe025e3q147b`).
  **ENGEL:** Coolify bu sürümde custom-compose (docker_compose_raw) servislerine env enjekte etmiyor →
  MinIO root cred'i alamıyor, denenen 6 cred de `InvalidAccessKeyId`. Çözüm: Coolify UI'dan MinIO
  servisinin gerçek cred'i alınıp api MINIO_ACCESS/SECRET_KEY'e yazılır (1 adım, kod değişmez).

## P6 — Test sertleştirme ⏳

## P7 — Coolify v2 deploy + parite + cutover 🔄

- [x] `rewrite` branch GitHub'a push (develop/main dokunulmadı); monorepo-aware Dockerfile'lar
- [x] **shifahub-postgres-v2** (PG17, izole) + **shifahub-backend-v2** (Coolify, Dockerfile, rewrite branch)
- [x] api boot'ta otomatik migrate + demo seed; HTTPS (Let's Encrypt sslip.io)
- [x] **BACKEND CANLI:** `https://ufx752pb2tk8uft3t86umoeo.185.255.95.111.sslip.io`
      → /health ✓, demo login (danışan/admin) ✓ — RLS+pgcrypto+JWT production'da çalışıyor
- [x] **FRONTEND CANLI:** `https://fn7lemtkwwvj3r8myn2wgqk4.185.255.95.111.sslip.io`
      → root/giris HTTP 200, CORS doğrulandı (web→api preflight 204), 39 route
- [x] 6 build sorunu çözüldü: workspace manifest, tRPC sürüm hizalama (11.16.0), Yarn/Corepack,
      lightningcss/oxide/swc linux binary → web build'de lockfile kopyalanmıyor (taze çözüm)
- [x] **REDESIGN TAMAM + CANLI:** 39 ekran elevated Shifa Ether desenine getirildi (BrandMark, StatusBadge,
      initials avatar, ikonlu alanlar + şifre toggle, katmanlı header, semantik alert, skeleton/empty) —
      giriş/kayıt/danışan dashboard elle, kalan ~35 ekran 4 paralel ajanla; tüm rotalar HTTP 200
- [x] **CUTOVER TAMAM — GERÇEK DOMAIN CANLI** 🎉 DNS Chrome MCP ile turkticaret DNS Pro'ya eklendi
      (`api`/`app.shifahub.com.tr` → `185.255.95.111`, NS=ns1/ns2.turkticaret.net); `.tr` yayıldı.
      Coolify cutover: api app fqdn += `https://api.shifahub.com.tr` + LE cert; web fqdn +=
      `https://app.shifahub.com.tr` + LE cert; web `NEXT_PUBLIC_API_URL=https://api.shifahub.com.tr`
      rebuild; api `CORS_ORIGIN` += app.shifahub.com.tr. **Doğrulandı:** app/giris HTTP 200,
      CORS preflight 204 (allow-origin app.shifahub.com.tr), gerçek-domain login token döndü.
      sslip.io adresleri de çalışıyor (blue/green korundu).
- **CANLI:** **https://app.shifahub.com.tr** (web) · **https://api.shifahub.com.tr** (api)
- [ ] eski sistem tampon → sonra P8 teardown
- Demo: turhanhamza@gmail.com/admin123, demo.egitmen@shifahub.app/egitmen123, demo.danisan@shifahub.app/danisan123
- **Eski sistem (shifahub-backend/frontend/postgres/redis) EL DEĞMEDEN çalışıyor** (blue/green)

## P8 — Teardown (geri dönüşsüz) 🔄

- [x] **Taze yedek:** `shifahub-backup-pre-teardown-2026-06-14.bundle` (tüm ref'ler, 772 KB)
- [x] **Eski v1 Coolify kaynakları SİLİNDİ** (kullanıcı: "veri önemsiz sil"): shifahub-backend,
      shifahub-frontend, shifahub-postgres, shifahub-redis → hepsi delete. Yeni v2 (gerçek domain)
      doğrulandı: api/app HTTP 200, v1 sorgu 404. Blue/green tamamlandı.
- [ ] kalan: git geçmişi (rewrite→main, develop sil) + broken MinIO kaynaklarını temizle
- Not: MinIO bu sunucuda S3-auth çözülemedi (custom-compose + docker-image, 10+ cred) →
  dosya depolama api kalıcı volume'üne taşındı (`/data`, shifahub-uploads), upload/list canlı doğrulandı.

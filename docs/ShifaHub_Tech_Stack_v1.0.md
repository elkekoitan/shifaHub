# ShifaHub — Tech Stack Dokümanı

**Technology Architecture & Stack Decision Record**

Versiyon: 1.0 | Tarih: 7 Nisan 2026 | Hazırlayan: Hamza Turhan

---

## 1. Mimari Genel Bakış

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Next.js 16 (App Router) — PWA — Mobile-First            │    │
│  │  React 19 + TypeScript 5.x + Tailwind CSS 4 + shadcn/ui  │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                     COMMUNICATION LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────────┐   │
│  │  REST API   │  │ WebSocket  │  │ Evolution API (WhatsApp) │   │
│  │  (tRPC)     │  │ (Socket.io)│  │ Telegram Bot API         │   │
│  └────────────┘  └────────────┘  └──────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Node.js 22 LTS — Fastify 5 — Agent-Based Architecture   │    │
│  │                                                           │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐          │    │
│  │  │ Auth │ │Book- │ │Clini-│ │Media │ │Knowl- │          │    │
│  │  │Agent │ │ ing  │ │ cal  │ │Agent │ │ edge  │          │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └───────┘          │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐          │    │
│  │  │Notif.│ │Anal- │ │Calen-│ │Compl-│ │Whats- │          │    │
│  │  │Agent │ │ytics │ │ dar  │ │iance │ │App Ag.│          │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └───────┘          │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │    │
│  │  │Tele- │ │Inven-│ │Finan-│ │Emerg-│                    │    │
│  │  │gram  │ │tory  │ │ ce   │ │ency  │                    │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                    │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │PostgreSQL│ │  Redis    │ │  MinIO   │ │  Qdrant  │           │
│  │ 17 +     │ │  8.x     │ │(S3-comp.)│ │(Vector)  │           │
│  │ Drizzle  │ │  Cache+Q │ │  Files   │ │Embeddings│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├──────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Coolify (Self-hosted PaaS) — Docker — Traefik — SSL     │    │
│  │  Grafana + Prometheus — Sentry — GitHub Actions CI/CD     │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Stack

### 2.1 Çekirdek Teknolojiler

| Teknoloji | Versiyon | Seçim Gerekçesi |
|-----------|---------|----------------|
| **Next.js** | 16.2 (App Router) | Turbopack default, Cache Components (use cache), proxy.ts, MCP DevTools, React Compiler stable, AGENTS.md, ~400% faster dev startup |
| **React** | 19.2 | View Transitions, useEffectEvent, Activity API, Server Components |
| **TypeScript** | 5.x (strict mode) | Tip güvenliği, refactoring kolaylığı, agent kodlama uyumu |
| **Tailwind CSS** | 4.x | Utility-first, mobil öncelikli, shadcn/ui uyumu, küçük bundle |
| **shadcn/ui** | Latest | Erişilebilir, özelleştirilebilir, Radix primitives üzerine kurulu |

### 2.2 Ek Frontend Kütüphaneleri

| Kütüphane | Kullanım Alanı |
|-----------|---------------|
| `@tanstack/react-query` | Server state yönetimi, cache, optimistic updates |
| `zustand` | Client state yönetimi (minimal, TypeScript-friendly) |
| `react-hook-form` + `zod` | Form yönetimi + şema validasyonu (anamnez, tedavi formları) |
| `@dnd-kit/core` | Drag-drop (randevu taşıma, şikayet öncelik sıralama) |
| `recharts` | Kan değerleri grafikleri, dashboard chart'ları |
| `date-fns` | Tarih manipülasyonu (Miladi) |
| `@formatjs/intl` | Hicri takvim desteği (Intl.DateTimeFormat polyfill) |
| `lucide-react` | İkon seti (consistent, tree-shakeable) |
| `@capacitor/camera` | Mobil kamera erişimi (PWA) |
| `framer-motion` | Mikro animasyonlar, page transitions |
| `next-pwa` | Service Worker, offline cache, manifest |
| `fabric.js` | Görsel annotation (tedavi bölgesi işaretleme) |
| `wavesurfer.js` | Ses kaydı dalga formu gösterimi |
| `react-pdf` | PDF rapor oluşturma (danışan tedavi özeti) |

### 2.3 PWA Konfigürasyonu

```typescript
// next.config.ts — Next.js 16 + PWA
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    { urlPattern: /^https:\/\/api\.shifahub\.app/, handler: 'NetworkFirst' },
    { urlPattern: /\.(png|jpg|svg)$/, handler: 'CacheFirst' },
    { urlPattern: /^https:\/\/fonts/, handler: 'StaleWhileRevalidate' },
  ],
  fallbacks: { document: '/offline' },
})({
  // Next.js 16 — Turbopack default, no --turbopack flag needed
  reactCompiler: true,  // React Compiler stable in 16
  logging: {
    browserToTerminal: 'error',  // Forward client errors (16.2)
  },
});
```

### 2.4 proxy.ts (Next.js 16 — replaces middleware.ts)

```typescript
// proxy.ts — Network boundary (Node.js runtime only)
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  // KVKK: Auth kontrolü
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/giris', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/egitmen/:path*', '/admin/:path*'],
};
```

### 2.4 Hicri Takvim Implementasyonu

```typescript
// lib/hijri-calendar.ts
export function formatHijriDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-SA-u-ca-islamic-umalqura', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

export function getHijriSunnahDays(hijriMonth: number, hijriYear: number) {
  // Ayın 17, 19, 21. günleri (hacamat sünnet günleri)
  return [17, 19, 21].map(day => ({
    hijriDay: day, hijriMonth, hijriYear,
    gregorian: hijriToGregorian(day, hijriMonth, hijriYear),
    label: `Hacamat Sünnet Günü (${day}. gün)`,
  }));
}
```

---

## 3. Backend Stack

### 3.1 Çekirdek Teknolojiler

| Teknoloji | Versiyon | Seçim Gerekçesi |
|-----------|---------|----------------|
| **Node.js** | 22 LTS | Performans, TypeScript native desteği (--experimental-strip-types), tooling |
| **Fastify** | 5.x | Express'ten 2-3x hızlı, schema-based validation, plugin ekosistemi |
| **tRPC** | 11.x | End-to-end type safety (frontend ↔ backend), API schema paylaşımı |
| **Drizzle ORM** | Latest | TypeScript-first, SQL-like syntax, migration tool, performans |
| **BullMQ** | 5.x | Redis-backed job queue (bildirim, transkripsiyon, embedding) |
| **Socket.io** | 4.x | Gerçek zamanlı mesajlaşma, canlı bildirimler |

### 3.2 API Tasarımı

```
api.shifahub.app/
├── /trpc/                    # tRPC router (type-safe)
│   ├── auth.*                # Kimlik doğrulama
│   ├── danisan.*             # Danışan CRUD
│   ├── egitmen.*             # Eğitmen CRUD
│   ├── randevu.*             # Randevu yönetimi
│   ├── tedavi.*              # Tedavi kayıtları
│   ├── tahlil.*              # Tahlil/kan değerleri
│   ├── stok.*                # Envanter yönetimi
│   ├── odeme.*               # Ödeme kayıtları
│   ├── mesaj.*               # Güvenli mesajlaşma
│   ├── bildirim.*            # Bildirim yönetimi
│   ├── chatbot.*             # AI chatbot
│   ├── admin.*               # Admin işlemleri
│   └── rapor.*               # Raporlama
├── /webhooks/
│   ├── /whatsapp             # Evolution API webhook receiver
│   └── /telegram             # Telegram Bot webhook
├── /upload/                  # Dosya yükleme (multipart)
└── /health                   # Health check endpoint
```

### 3.3 Agent Sistemi Implementasyonu

```typescript
// agents/base-agent.ts
export abstract class BaseAgent {
  protected queue: Queue;
  protected eventBus: EventEmitter;

  abstract name: string;
  abstract handle(event: AgentEvent): Promise<AgentResult>;

  protected async emit(event: string, data: unknown) {
    await this.eventBus.emit(event, data);
  }
}

// agents/clinical-agent.ts
export class ClinicalAgent extends BaseAgent {
  name = 'clinical';

  async handle(event: AgentEvent): Promise<AgentResult> {
    switch (event.type) {
      case 'TREATMENT_RECORD_CREATE':
        return this.createTreatmentRecord(event.payload);
      case 'ANAMNESIS_EVALUATE':
        return this.evaluateAnamnesis(event.payload);
      case 'NER_EXTRACT':
        return this.extractEntities(event.payload);  // NER pipeline
      case 'CONTRAINDICATION_CHECK':
        return this.checkContraindications(event.payload);
      default:
        throw new UnhandledEventError(event);
    }
  }
}
```

### 3.4 NER Pipeline (Bağlam Farkındalıklı AI)

```typescript
// agents/clinical-agent/ner-pipeline.ts
interface NERResult {
  diseases: string[];      // "bel fıtığı", "migren"
  herbs: string[];         // "kırk kilit otu", "çörek otu"
  bodyParts: string[];     // "L4-L5", "servikal"
  treatments: string[];   // "hacamat", "sülük"
}

export async function extractEntities(text: string): Promise<NERResult> {
  // 1. Önceden eğitilmiş GETAT NER modeli (veya Claude API ile extraction)
  // 2. Külliyat taxonomy eşleştirme
  // 3. ICD-10 kod haritalaması
  // 4. Knowledge Agent'a sorgu tetikleme
}
```

---

## 4. Veritabanı Katmanı

### 4.1 PostgreSQL 17

**Ana veritabanı** — İlişkisel veri, ACID uyumluluk, RLS (Row-Level Security)

```sql
-- Temel şema yapısı (Drizzle ORM ile tanımlanır)
-- Her tablo tenant isolation için user_id/egitmen_id bağlantılıdır

-- Danışan tablosu
CREATE TABLE danisan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad VARCHAR(100) NOT NULL,
  soyad VARCHAR(100) NOT NULL,
  tc_kimlik VARCHAR(11),  -- Şifreli saklanır (pgcrypto)
  telefon VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  dogum_tarihi DATE,
  boy_cm SMALLINT,
  kilo_kg DECIMAL(5,2),
  kan_grubu VARCHAR(5),
  sehir VARCHAR(100),
  kvkk_riza JSONB,  -- {tedavi: true, bildirim: true, whatsapp: false, ...}
  kvkk_riza_tarihi TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politikası
ALTER TABLE danisan ENABLE ROW LEVEL SECURITY;
CREATE POLICY danisan_egitmen_policy ON danisan
  USING (id IN (
    SELECT danisan_id FROM egitmen_danisan
    WHERE egitmen_id = current_setting('app.current_user_id')::UUID
  ));

-- Audit log tablosu (KVKK)
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Şema Şifreleme Stratejisi

```
TC Kimlik No    → pgcrypto AES-256 encrypt, ayrı anahtar
Telefon         → Son 4 hane hariç maskeleme (UI), DB'de encrypt
Sağlık Verileri → Ayrı encryption key (HSM yönetimli)
Dosyalar        → MinIO server-side encryption (SSE-S3)
```

### 4.3 Redis 8.x

| Kullanım | TTL | Açıklama |
|----------|-----|----------|
| Session cache | 30 dk | JWT session metadata |
| Rate limiting | 1 dk | Brute force koruması |
| BullMQ queues | — | Job queue (bildirim, STT, embedding) |
| Real-time presence | 5 dk | Online kullanıcı durumu |
| Hicri takvim cache | 24 saat | Dönüşüm sonuçları cache |
| API response cache | 5 dk | Sık sorgulanan endpoint'ler |

### 4.4 MinIO (S3-Compatible Object Storage)

```yaml
# Bucket yapısı
shifahub-uploads/
├── danisan/{danisan_id}/
│   ├── tahliller/          # PDF, görsel tahlil dosyaları
│   ├── tedavi-gorseller/   # Öncesi/sonrası fotoğraflar
│   └── belgeler/           # Onam formları, raporlar
├── egitmen/{egitmen_id}/
│   ├── sertifikalar/       # GETAT sertifikaları
│   ├── ses-notlari/        # Sesli not kayıtları (.m4a)
│   └── profil/             # Profil fotoğrafı
└── kulliyat/
    ├── kaynaklar/           # PDF/DOCX kaynak dosyaları
    └── embeddings/          # Processed chunk backups
```

**Neden MinIO?** KVKK uyumu — veriler yurt içi sunucuda kalır. S3 API uyumlu olduğu için ileride AWS S3'e geçiş kolay.

### 4.5 Qdrant (Vector Database)

```typescript
// Külliyat embedding konfigürasyonu
const qdrantConfig = {
  collection: 'shifahub_kulliyat',
  vectorSize: 1536,  // text-embedding-3-small
  distance: 'Cosine',
  payload: {
    source_type: 'keyword',   // hadis, makale, monograf, mevzuat
    source_ref: 'keyword',    // kitap-bab-no veya DOI
    language: 'keyword',      // tr, ar, en
    tags: 'keyword',          // ICD-10 kodları, bitki isimleri
    content_chunk: 'text',
  },
};
```

---

## 5. AI & ML Stack

### 5.1 LLM — Claude API (Anthropic)

| Kullanım | Model | Max Tokens | Açıklama |
|----------|-------|-----------|----------|
| Chatbot (Eğitmen) | claude-sonnet-4-6 | 4096 | Teknik/klinik sorular, kaynak referanslı |
| Chatbot (Danışan) | claude-haiku-4-5 | 1024 | Genel bilgi, hızlı yanıt, düşük maliyet |
| NER Extraction | claude-haiku-4-5 | 512 | Tedavi notu entity extraction |
| Kontrendikasyon | claude-sonnet-4-6 | 2048 | İlaç-tedavi çapraz kontrol |
| WhatsApp Bot | claude-haiku-4-5 | 512 | Hızlı yanıt, maliyet optimize |

### 5.2 Embedding — OpenAI

| Model | Boyut | Kullanım |
|-------|-------|----------|
| text-embedding-3-small | 1536 | Külliyat chunk embedding |
| text-embedding-3-small | 1536 | Sorgu embedding (arama) |

### 5.3 STT — OpenAI Whisper

```typescript
// Whisper API kullanımı
const transcription = await openai.audio.transcriptions.create({
  model: 'whisper-1',
  file: audioFile,
  language: 'tr',
  response_format: 'verbose_json',  // Timestamp'li transkript
  timestamp_granularities: ['word'],
});
```

### 5.4 RAG Pipeline Detayı

```
Kaynak Ekleme (Ingestion):
  PDF/DOCX → Text extraction → Chunk (512 token, 50 overlap)
  → Metadata ekleme (kaynak tipi, referans, ICD-10 tag)
  → Embedding (text-embedding-3-small)
  → Qdrant'a upsert

Sorgu (Query):
  Kullanıcı sorusu → Embedding
  → Qdrant similarity search (top-k=5, score threshold=0.75)
  → Re-ranking (cross-encoder veya Claude-based)
  → Context assembly (chunks + metadata)
  → Claude API call (system prompt + context + soru)
  → Yanıt + kaynak referansları
  → Feragat notu ekleme
```

---

## 6. Mesajlaşma & Bildirim Stack

### 6.1 WhatsApp — Evolution API

| Bileşen | Teknoloji |
|---------|-----------|
| Gateway | Evolution API v2.x (Docker container) |
| Protokol | Baileys (dev) → Cloud API (production) |
| Webhook | Fastify webhook endpoint |
| Mesaj Queue | BullMQ (retry + rate limiting) |
| Template | Handlebars.js şablon motoru |

```typescript
// WhatsApp mesaj gönderimi
async function sendWhatsAppMessage(phone: string, template: string, data: Record<string, string>) {
  const rendered = Handlebars.compile(templates[template])(data);
  await evolutionApi.post(`/message/sendText/${instanceName}`, {
    number: phone,
    text: rendered,
  });
}

// Interactive buttons
async function sendWhatsAppButtons(phone: string, body: string, buttons: Button[]) {
  await evolutionApi.post(`/message/sendButtons/${instanceName}`, {
    number: phone,
    title: 'ShifaHub',
    description: body,
    buttons: buttons.map(b => ({ buttonId: b.id, buttonText: { displayText: b.label } })),
  });
}
```

### 6.2 Telegram — grammY Framework

```typescript
// Telegram bot kurulumu
import { Bot, InlineKeyboard } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Eğitmen komutları
bot.command('ajanda', async (ctx) => {
  const userId = await getUserByTelegramId(ctx.from.id);
  const appointments = await getToday Appointments(userId);
  await ctx.reply(formatAgenda(appointments), { parse_mode: 'HTML' });
});

bot.command('stok', async (ctx) => {
  const stock = await getStockSummary(ctx.from.id);
  await ctx.reply(formatStock(stock), { parse_mode: 'HTML' });
});

bot.command('acil', async (ctx) => {
  const kb = new InlineKeyboard()
    .text('Bayılma', 'emr:bayilma')
    .text('Alerjik Reaksiyon', 'emr:alerji').row()
    .text('Aşırı Kanama', 'emr:kanama')
    .text('Diğer', 'emr:diger');
  await ctx.reply('⚠️ Komplikasyon tipi seçin:', { reply_markup: kb });
});

// Webhook mode (Coolify arkasında)
bot.api.setWebhook('https://api.shifahub.app/webhooks/telegram');
```

### 6.3 SMS — Netgsm

```typescript
// SMS gönderimi
async function sendSMS(phone: string, message: string) {
  await netgsm.post('/sms/send/get', {
    usercode: process.env.NETGSM_USER,
    password: process.env.NETGSM_PASS,
    gsmno: phone,
    message: message,
    msgheader: 'SHIFAHUB',
  });
}
```

### 6.4 Push Notification — FCM

```typescript
// Firebase Cloud Messaging (PWA)
import { getMessaging } from 'firebase-admin/messaging';

async function sendPushNotification(token: string, title: string, body: string) {
  await getMessaging().send({
    token,
    notification: { title, body },
    webpush: { fcmOptions: { link: 'https://app.shifahub.app' } },
  });
}
```

### 6.5 E-posta — Resend

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: 'ShifaHub <bildirim@shifahub.app>',
    to, subject, html,
  });
}
```

---

## 7. Altyapı & DevOps

### 7.1 Coolify Konfigürasyonu

```yaml
# docker-compose.yml — Coolify orchestration
version: '3.8'

services:
  # === APPLICATION ===
  frontend:
    build: ./apps/web
    environment:
      - NEXT_PUBLIC_API_URL=https://api.shifahub.app
      - NEXT_PUBLIC_WS_URL=wss://api.shifahub.app
    labels:
      - coolify.domain=app.shifahub.app

  backend:
    build: ./apps/api
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - QDRANT_URL=http://qdrant:6333
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - EVOLUTION_API_URL=http://evolution:8080
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    labels:
      - coolify.domain=api.shifahub.app
    depends_on: [postgres, redis, minio, qdrant]

  evolution:
    image: atendai/evolution-api:latest
    environment:
      - AUTHENTICATION_API_KEY=${EVO_API_KEY}
      - DATABASE_CONNECTION_URI=postgresql://${DB_USER}:${DB_PASS}@postgres:5432/evolution
      - CACHE_REDIS_URI=redis://redis:6379/1
      - SERVER_URL=https://wa.shifahub.app
      - WEBHOOK_GLOBAL_URL=https://api.shifahub.app/webhooks/whatsapp
      - WEBHOOK_GLOBAL_ENABLED=true
    labels:
      - coolify.domain=wa.shifahub.app

  # === DATA ===
  postgres:
    image: postgres:17-alpine
    volumes: [pg_data:/var/lib/postgresql/data]
    environment:
      - POSTGRES_DB=shifahub
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASS}

  redis:
    image: redis:8-alpine
    volumes: [redis_data:/data]
    command: redis-server --appendonly yes

  minio:
    image: minio/minio:latest
    volumes: [minio_data:/data]
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_PASS}

  qdrant:
    image: qdrant/qdrant:latest
    volumes: [qdrant_data:/qdrant/storage]

  # === WORKERS ===
  worker-notification:
    build: ./apps/api
    command: node dist/workers/notification.js
    depends_on: [redis, postgres]

  worker-media:
    build: ./apps/api
    command: node dist/workers/media.js
    depends_on: [redis, minio]

  worker-embedding:
    build: ./apps/api
    command: node dist/workers/embedding.js
    depends_on: [redis, qdrant]

  # === MONITORING ===
  prometheus:
    image: prom/prometheus:latest
    volumes: [./prometheus.yml:/etc/prometheus/prometheus.yml]

  grafana:
    image: grafana/grafana:latest
    labels:
      - coolify.domain=monitor.shifahub.app

volumes:
  pg_data:
  redis_data:
  minio_data:
  qdrant_data:
```

### 7.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Coolify

on:
  push:
    branches: [develop]   # Staging auto-deploy
  release:
    types: [published]    # Production manual deploy

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_STAGING }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"

  deploy-production:
    needs: test
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_PRODUCTION }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

### 7.3 Monorepo Yapısı (Turborepo)

```
shifahub/
├── AGENTS.md                 # AI agent instructions (Next.js 16 standard)
├── apps/
│   ├── web/                  # Next.js 16 frontend (PWA)
│   │   ├── app/              # App Router pages
│   │   ├── components/       # UI components
│   │   ├── lib/              # Utilities
│   │   ├── proxy.ts          # Network proxy (replaces middleware.ts)
│   │   └── public/           # Static assets + PWA manifest
│   └── api/                  # Fastify backend
│       ├── agents/           # Agent implementations
│       ├── routes/           # tRPC routers
│       ├── workers/          # BullMQ workers
│       ├── webhooks/         # WhatsApp + Telegram handlers
│       └── db/               # Drizzle schema + migrations
├── packages/
│   ├── shared/               # Shared types, constants, utils
│   ├── ui/                   # Shared UI components
│   └── config/               # ESLint, TS, Tailwind configs
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 8. Güvenlik Stack

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| Auth | jose (JWT) + argon2 | Token yönetimi + şifre hash |
| MFA | otpauth | TOTP tabanlı iki faktörlü doğrulama |
| Encryption | pgcrypto + Node.js crypto | DB field-level + application-level şifreleme |
| HTTPS | Let's Encrypt (Traefik) | Otomatik SSL sertifikası |
| CORS | Fastify CORS plugin | Origin whitelist |
| Rate Limit | @fastify/rate-limit | Brute force koruması |
| CAPTCHA | hCaptcha | Bot koruması (kayıt, giriş) |
| CSP | Helmet.js | Content Security Policy headers |
| WAF | Traefik middleware | Temel web application firewall |
| Monitoring | Sentry | Error tracking + performance monitoring |
| Audit | Custom audit_log tablosu | KVKK erişim logları |
| Secrets | Coolify env management | Ortam değişkeni şifreleme |

---

## 9. Test Stack

| Tip | Teknoloji | Kapsam |
|-----|-----------|--------|
| Unit Test | Vitest | Business logic, agent'ler, utility fonksiyonlar |
| Integration Test | Vitest + Supertest | API endpoint'leri, DB işlemleri |
| E2E Test | Playwright | Kritik kullanıcı akışları (kayıt, randevu, tedavi) |
| Component Test | Testing Library | React component davranışları |
| Visual Regression | Playwright screenshots | UI tutarlılık kontrolü |
| API Contract | Zod schemas (tRPC) | Frontend-backend kontrat doğrulama |
| Load Test | k6 | Performans ve ölçeklenebilirlik |
| Security Test | OWASP ZAP | Güvenlik açığı taraması |

**Hedef Coverage:** ≥80% unit, ≥60% integration, kritik akışlar %100 E2E

---

## 10. Monitoring & Observability

| Araç | Kullanım |
|------|----------|
| **Grafana** | Dashboard'lar: sistem sağlığı, API latency, kullanıcı metrikleri |
| **Prometheus** | Metrik toplama: CPU, RAM, disk, request count, error rate |
| **Sentry** | Error tracking, performance monitoring, session replay |
| **Loki** | Log aggregation (Grafana entegrasyonlu) |
| **Uptime Kuma** | Endpoint uptime monitoring (Coolify içinde) |
| **Evolution API Dashboard** | WhatsApp bağlantı durumu, mesaj istatistikleri |

---

## 11. Teknoloji Karar Gerekçeleri (ADR Özeti)

### ADR-001: Neden Next.js 16 (Express/Fastify fullstack değil)?

**Karar:** Frontend için Next.js 16, Backend için ayrı Fastify servisi.
**Gerekçe:** Turbopack default bundler (2-5x faster builds), Cache Components ile explicit caching (use cache directive), proxy.ts ile net network boundary, MCP DevTools ile AI-assisted debugging, React 19.2 View Transitions. Backend ayrı tutularak agent sistemi bağımsız ölçeklenebilir. AGENTS.md ile AI coding agent'ları proje bağlamını otomatik anlıyor.

### ADR-002: Neden Drizzle ORM (Prisma değil)?

**Karar:** Drizzle ORM.
**Gerekçe:** SQL-like syntax (PostgreSQL özelliklerinden tam yararlanma), daha küçük bundle, daha hızlı query generation, RLS politikalarıyla doğal uyum.

### ADR-003: Neden tRPC (REST/GraphQL değil)?

**Karar:** tRPC.
**Gerekçe:** End-to-end type safety, API şema otomatik paylaşımı, solo developer için geliştirme hızı. GraphQL'in complexity overhead'i bu projede gereksiz.

### ADR-004: Neden Evolution API (Twilio/Meta Cloud API direkt değil)?

**Karar:** Evolution API (self-hosted).
**Gerekçe:** KVKK — mesaj geçişi yurt içi sunucuda kalır. Maliyet — per-message ücret yok. Baileys + Cloud API dual desteği ile risk azaltma. Coolify ile aynı sunucuda deploy.

### ADR-005: Neden Qdrant (Pinecone/Weaviate değil)?

**Karar:** Qdrant.
**Gerekçe:** Self-hosted (KVKK uyumu), Docker ile kolay deploy, Rust-based performans, Coolify'da yan container olarak çalışır. Pinecone cloud-only (veri yurt dışında).

### ADR-006: Neden Claude API (OpenAI GPT değil)?

**Karar:** Claude API (Anthropic).
**Gerekçe:** Daha uzun context window, daha güvenli yanıtlar (sağlık alanında kritik), Türkçe dil kalitesi, constitutional AI yaklaşımı.

### ADR-007: Neden Coolify (Vercel/Railway değil)?

**Karar:** Coolify (self-hosted PaaS).
**Gerekçe:** KVKK — tüm veriler yurt içi VPS'te. Maliyet — sabit sunucu ücreti, kullanım bazlı fiyatlandırma yok. Docker-native — tüm servisler tek yerden yönetim. Git-push deploy kolaylığı.

### ADR-008: Neden MinIO (AWS S3/Cloudflare R2 değil)?

**Karar:** MinIO (self-hosted).
**Gerekçe:** Sağlık verileri (görsel, ses, belge) yurt içinde saklanmalı (KVKK). S3 API uyumlu — ileride migration kolay.

---

## 12. Performans Bütçesi

| Metrik | Hedef | Ölçüm Aracı |
|--------|-------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| Total Bundle Size (JS) | <250KB gzipped | Next.js analyzer |
| API Response (P95) | <500ms | Prometheus |
| WebSocket Latency | <100ms | Custom metric |
| Lighthouse Score | ≥90 | Lighthouse CI |

---

## 13. Versiyon Uyumluluk Matrisi

| Bileşen | Minimum Versiyon | Önerilen | Son Test |
|---------|-----------------|----------|----------|
| Next.js | 16.0 | 16.2 | — |
| React | 19.2 | 19.2 | — |
| Node.js | 20 LTS | 22 LTS | — |
| PostgreSQL | 15 | 17 | — |
| Redis | 7 | 8 | — |
| Docker | 24 | 27 | — |
| Coolify | 4.x | Latest | — |
| Evolution API | 2.x | Latest | — |
| Turbopack | Stable (Next.js 16 built-in) | — | — |

---

## 14. Maliyet Tahmini (Aylık)

| Kalem | Sağlayıcı | Tahmini Maliyet |
|-------|-----------|----------------|
| VPS (8 vCPU, 16GB RAM, 200GB SSD) | Hetzner / Contabo (DE/TR) | €30-50 |
| Domain (.app) | Namecheap | €15/yıl |
| SMS Gateway | Netgsm | ~₺500 (1000 SMS) |
| Claude API | Anthropic | ~$50 (haiku ağırlıklı) |
| OpenAI API (Whisper + Embedding) | OpenAI | ~$30 |
| E-posta | Resend | Free (3000/ay), sonra $20 |
| Monitoring | Self-hosted (Grafana) | ₺0 |
| SSL | Let's Encrypt | ₺0 |
| **Toplam MVP** | | **~€80-120/ay (~₺3000-4500)** |

---

*Bu doküman ShifaHub projesi için hazırlanmış Tech Stack belgesidir.*

*© 2026 — Tüm hakları saklıdır.*

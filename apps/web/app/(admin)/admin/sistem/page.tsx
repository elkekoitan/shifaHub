"use client";

import { Settings, Server, Database, ShieldCheck, Bell, Wrench } from "lucide-react";

const PLANNED = [
  {
    icon: Server,
    title: "Servis durumu",
    desc: "API, Redis, MinIO ve Qdrant sağlık kontrolleri burada izlenecek.",
  },
  {
    icon: Database,
    title: "Veritabanı bakımı",
    desc: "Yedekleme durumu, migration geçmişi ve saklama (retention) ayarları.",
  },
  {
    icon: ShieldCheck,
    title: "Güvenlik & KVKK",
    desc: "Şifreleme anahtarı rotasyonu, RLS politikaları ve denetim ayarları.",
  },
  {
    icon: Bell,
    title: "Bildirim kanalları",
    desc: "WhatsApp, Telegram, SMS ve e-posta sağlayıcı yapılandırması.",
  },
];

export default function SistemPage() {
  return (
    <div>
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Sistem ayarları</h1>
        <p className="mt-1 text-sm text-text-2">Platform yapılandırması ve altyapı yönetimi.</p>
      </header>

      <div className="mb-6 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-[var(--radius)] bg-muted">
          <Wrench className="size-6 text-text-3" aria-hidden />
        </div>
        <div>
          <p className="font-headline text-base font-semibold text-foreground">Bu bölüm yakında</p>
          <p className="mt-1 max-w-sm text-sm text-text-2">
            Sistem ayarları için henüz bir tRPC prosedürü tanımlı değil. İlgili prosedürler
            eklendiğinde aşağıdaki başlıklar etkinleştirilecek.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLANNED.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-[var(--radius)] border border-border bg-card p-4 opacity-80"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-[var(--radius)] bg-muted">
                <Icon className="size-4 text-text-2" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <Settings className="ml-auto size-3.5 text-text-3" aria-hidden />
            </div>
            <p className="mt-2 text-xs text-text-2">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

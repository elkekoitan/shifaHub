"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock3, ShieldQuestion, LogOut, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const APPROVAL: Record<string, { label: string; tone: string; icon: typeof BadgeCheck }> = {
  approved: { label: "Onaylandı", tone: "bg-success/10 text-success", icon: BadgeCheck },
  pending: { label: "Onay bekleniyor", tone: "bg-warning/10 text-warning", icon: Clock3 },
  rejected: {
    label: "Reddedildi",
    tone: "bg-destructive/10 text-destructive",
    icon: ShieldQuestion,
  },
};

export default function EgitmenProfilPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const me = trpc.egitmen.me.useQuery();
  const utils = trpc.useUtils();
  const guncelle = trpc.egitmen.guncelle.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      void utils.egitmen.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    clinicName: "",
    clinicCity: "",
    clinicPhone: "",
    certificateNumber: "",
    supervisingPhysicianName: "",
    bio: "",
  });

  // Sunucudan gelen profili forma yukle.
  useEffect(() => {
    if (!me.data) return;
    setForm({
      clinicName: me.data.clinicName ?? "",
      clinicCity: me.data.clinicCity ?? "",
      clinicPhone: me.data.clinicPhone ?? "",
      certificateNumber: me.data.certificateNumber ?? "",
      supervisingPhysicianName: me.data.supervisingPhysicianName ?? "",
      bio: me.data.bio ?? "",
    });
  }, [me.data]);

  function save() {
    guncelle.mutate({
      clinicName: form.clinicName || null,
      clinicCity: form.clinicCity || null,
      clinicPhone: form.clinicPhone || null,
      certificateNumber: form.certificateNumber || null,
      supervisingPhysicianName: form.supervisingPhysicianName || null,
      bio: form.bio || null,
    });
  }

  function logout() {
    clear();
    router.replace("/giris");
  }

  const approval = me.data?.approvalStatus ? APPROVAL[me.data.approvalStatus] : undefined;

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Profilim</h1>
      </header>

      {/* Kullanici kunyesi + onay durumu */}
      <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-base font-semibold text-primary">
          {`${(user?.firstName ?? "").charAt(0)}${(user?.lastName ?? "").charAt(0)}`.toUpperCase() ||
            "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Eğitmen"}
          </p>
          <p className="truncate text-xs text-text-3">{user?.email}</p>
        </div>
        {me.isLoading ? (
          <Skeleton className="h-6 w-24 rounded-full" />
        ) : approval ? (
          <span
            className={
              "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium " +
              approval.tone
            }
          >
            <approval.icon className="size-3" aria-hidden /> {approval.label}
          </span>
        ) : null}
      </div>

      {/* Profil formu */}
      {me.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="clinicName">Klinik adı</Label>
            <Input
              id="clinicName"
              value={form.clinicName}
              onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))}
              placeholder="Klinik / merkez adı"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clinicCity">Şehir</Label>
              <Input
                id="clinicCity"
                value={form.clinicCity}
                onChange={(e) => setForm((f) => ({ ...f, clinicCity: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinicPhone">Klinik telefonu</Label>
              <Input
                id="clinicPhone"
                type="tel"
                value={form.clinicPhone}
                onChange={(e) => setForm((f) => ({ ...f, clinicPhone: e.target.value }))}
                placeholder="0xxx xxx xx xx"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="certificateNumber">Sertifika no</Label>
            <Input
              id="certificateNumber"
              value={form.certificateNumber}
              onChange={(e) => setForm((f) => ({ ...f, certificateNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supervisingPhysicianName">Sorumlu tabip</Label>
            <Input
              id="supervisingPhysicianName"
              value={form.supervisingPhysicianName}
              onChange={(e) => setForm((f) => ({ ...f, supervisingPhysicianName: e.target.value }))}
              placeholder="Dr. Ad Soyad"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Hakkımda</Label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Uzmanlık ve deneyiminiz…"
              className="flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
            />
          </div>

          <Button className="w-full" loading={guncelle.isPending} onClick={save}>
            <Save className="size-4" aria-hidden /> Profili kaydet
          </Button>
        </div>
      )}

      <Button variant="outline" className="mt-4 w-full text-destructive" onClick={logout}>
        <LogOut className="size-4" aria-hidden /> Çıkış yap
      </Button>
    </div>
  );
}

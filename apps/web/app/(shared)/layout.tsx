"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

/**
 * Paylaşılan alan — tüm roller için ortak sayfalar (ör. bildirim). Rol-bazlı
 * kapılama yoktur; yalnızca oturum açık mı diye bakılır, değilse girişe yönlendirir.
 * Hydration bekleme deseni danışan/eğitmen layout'ları ile birebir aynıdır.
 */
export default function SharedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/giris");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  return <div className="mx-auto min-h-screen max-w-md pb-10">{children}</div>;
}

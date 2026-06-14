"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

/** Onboarding kabuğu: tam ekran, navigasyonsuz; yalnız giriş yapmış kullanıcı. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/giris");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  return <div className="mx-auto min-h-screen max-w-md">{children}</div>;
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <div className="text-center space-y-4 sm:space-y-6 max-w-lg w-full px-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-bold text-primary tracking-tight">ShifaHub</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">Butunsel Tedavi Yonetim Platformu</p>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground/70">
          GETAT Uygulayicilari Icin Dijital Cozum
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/giris">Giris Yap</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/kayit">Kayit Ol</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

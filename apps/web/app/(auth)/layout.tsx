export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sol: Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="150" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="90" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="60" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-2xl font-bold mb-6">
            S
          </div>
          <h1 className="text-3xl font-bold mb-3">ShifaHub</h1>
          <p className="text-lg text-white/80 mb-2">Butunsel Tedavi Yonetim Platformu</p>
          <p className="text-sm text-white/60 leading-relaxed">
            GETAT uygulayicilari icin danisan yonetimi, randevu takibi ve tedavi protokolleri
          </p>
        </div>
      </div>

      {/* Sag: Form alani */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobil logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold mb-3">
              S
            </div>
            <h1 className="text-xl font-bold text-foreground">ShifaHub</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

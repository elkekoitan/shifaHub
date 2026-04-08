export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-teal-700">ShifaHub</h1>
        <p className="text-xl text-gray-600">
          Butunsel Tedavi Yonetim Platformu
        </p>
        <p className="text-sm text-gray-400">
          GETAT Uygulayicilari Icin Dijital Cozum
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/giris"
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Giris Yap
          </a>
          <a
            href="/kayit"
            className="px-6 py-3 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
          >
            Kayit Ol
          </a>
        </div>
      </div>
    </main>
  );
}

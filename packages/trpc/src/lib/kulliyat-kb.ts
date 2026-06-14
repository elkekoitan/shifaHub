/**
 * ShifaHub Asistanı — küratörlü bilgi tabanı (KB). Qdrant/embedding gerektirmeyen,
 * anahtar-kelime + eşanlamlı eşleşmeli hafif retrieval. Her yöntem için: tanım,
 * endikasyon, sünnet/gelenek dayanağı, dikkat/kontrendikasyon, seans bilgisi.
 *
 * Bu KB, asistanın yanıtlarını "uydurmadan" temellendirmek içindir (grounding).
 * Tıbbi teşhis değildir; bilgilendiricidir.
 */

export interface KbEntry {
  id: string;
  baslik: string;
  /** Eşleşme için anahtar kelimeler + eşanlamlılar (küçük harf). */
  anahtarlar: string[];
  tanim: string;
  endikasyonlar: string[];
  gelenek: string;
  dikkat: string[];
  seans: string;
}

export const KULLIYAT_KB: KbEntry[] = [
  {
    id: "hacamat",
    baslik: "Hacamat (Kupa / Hijama)",
    anahtarlar: [
      "hacamat",
      "hicama",
      "hijama",
      "kupa",
      "yas hacamat",
      "kuru hacamat",
      "kan aldirma",
    ],
    tanim:
      "Cilt yüzeyine vakumlu kupalar uygulanarak (kuru) veya küçük çiziklerle bir miktar kan alınarak (yaş) yapılan, durağan kanın ve toksinlerin uzaklaştırılması hedeflenen geleneksel bir uygulamadır.",
    endikasyonlar: [
      "bel/sırt/boyun ağrıları ve kas gerginliği",
      "migren ve gerilim tipi baş ağrısı",
      "kan dolaşımını destekleme",
      "genel yorgunluk ve durgunluk hâli",
    ],
    gelenek:
      "Peygamber sünnetinde tavsiye edilen bir uygulamadır; hacamat için en uygun günler Hicri ayın 17, 19 ve 21. günleridir.",
    dikkat: [
      "Hamilelik, kanama bozukluğu (hemofili, koagülopati) ve kan sulandırıcı ilaç kullanımında yaş hacamat sakıncalıdır.",
      "Diyabette yara iyileşmesi yavaş olabilir; uzman gözetimi şarttır.",
      "Steril, tek kullanımlık ekipman zorunludur.",
    ],
    seans:
      "Genellikle 30-45 dakika sürer; ihtiyaca göre belirli aralıklarla tekrarlanabilir. Uygulama bir eğitmen/uygulama uzmanı tarafından yapılmalıdır.",
  },
  {
    id: "suluk",
    baslik: "Sülük (Hirudoterapi)",
    anahtarlar: ["suluk", "sülük", "hirudoterapi", "hirudo", "soluucan", "solucan"],
    tanim:
      "Tıbbi sülüklerin (Hirudo medicinalis) cilde uygulanmasıyla, salgıladıkları hirudin gibi maddeler aracılığıyla bölgesel dolaşımı ve doku iyileşmesini desteklemeyi amaçlayan uygulamadır.",
    endikasyonlar: [
      "varis ve bölgesel dolaşım sorunları",
      "eklem ağrıları ve iltihabi durumlarda destek",
      "bölgesel ödem ve morluklar",
    ],
    gelenek: "Geleneksel tıpta uzun geçmişi olan, kan akışını düzenlemeye yönelik bir yöntemdir.",
    dikkat: [
      "Kan sulandırıcı kullanımı, kanama bozukluğu, anemi ve hamilelikte sakıncalı olabilir.",
      "Yalnızca tıbbi, tek kullanımlık sülükle ve uzman gözetiminde yapılmalıdır.",
    ],
    seans: "Uygulama 30-60 dakika sürebilir; bölgeye ve ihtiyaca göre planlanır.",
  },
  {
    id: "sujok",
    baslik: "Sujok Terapi",
    anahtarlar: ["sujok", "su jok", "el ayak terapi", "refleks nokta"],
    tanim:
      "El ve ayaklardaki, vücudun tamamına karşılık geldiği kabul edilen yansıma noktalarının uyarılmasıyla (basınç, tohum, mıknatıs) denge ve rahatlama hedefleyen bir yöntemdir.",
    endikasyonlar: [
      "ağrı yönetiminde destek",
      "stres ve gerginliğin azaltılması",
      "genel rahatlama",
    ],
    gelenek: "Refleksoloji geleneğiyle akraba, invaziv olmayan bir uygulamadır.",
    dikkat: ["İnvaziv değildir; yine de gebelik ve ciddi hastalıklarda uzmana danışılmalıdır."],
    seans: "20-40 dakikalık seanslar hâlinde uygulanır.",
  },
  {
    id: "refleksoloji",
    baslik: "Refleksoloji",
    anahtarlar: ["refleksoloji", "refleks", "ayak masaji", "ayak terapi"],
    tanim:
      "Ayak, el ve kulaktaki refleks bölgelerine uygulanan özel basınç teknikleriyle gevşeme ve dengeyi desteklemeyi amaçlayan invaziv olmayan bir uygulamadır.",
    endikasyonlar: ["stres ve uyku kalitesi", "genel rahatlama", "dolaşımı destekleme"],
    gelenek: "Geleneksel dokunma-temelli yöntemlerle uyumludur.",
    dikkat: ["Ayakta yara/enfeksiyon, derin ven trombozu şüphesinde uygulanmaz."],
    seans: "30-45 dakikalık seanslar.",
  },
  {
    id: "fitoterapi",
    baslik: "Fitoterapi (Bitkisel Destek)",
    anahtarlar: ["fitoterapi", "bitkisel", "bitki", "sifali ot", "çay", "kür"],
    tanim:
      "Bilimsel ve geleneksel bilgiye dayanarak bitkilerin ve bitkisel preparatların sağlığı desteklemek amacıyla kullanılmasıdır.",
    endikasyonlar: ["sindirim desteği", "bağışıklığı destekleme", "rahatlama ve uyku"],
    gelenek:
      "Geleneksel tıpta ve sünnette çörekotu, bal, zeytinyağı gibi pek çok bitki/gıda tavsiye edilmiştir.",
    dikkat: [
      "Bitki-ilaç etkileşimleri olabilir; kullanılan ilaçlar mutlaka uzmana bildirilmelidir.",
      "Hamilelik ve kronik hastalıklarda doz ve uygunluk uzmana sorulmalıdır.",
    ],
    seans: "Kür planı kişiye göre eğitmen tarafından belirlenir.",
  },
  {
    id: "kupa_ozon",
    baslik: "Kupa ve Ozon Destek Uygulamaları",
    anahtarlar: ["ozon", "ozon terapi", "kupa terapi", "kuru kupa"],
    tanim:
      "Kuru kupa ile bölgesel dolaşımı uyarma ve uygun endikasyonlarda ozon destek uygulamaları gibi tamamlayıcı yöntemleri içerir.",
    endikasyonlar: ["kas gerginliği", "bölgesel dolaşım desteği"],
    gelenek: "Geleneksel kupa uygulamalarının modern tamamlayıcı biçimleridir.",
    dikkat: ["Endikasyon ve uygunluk mutlaka uzman tarafından değerlendirilmelidir."],
    seans: "Uygulamaya göre 20-40 dakika.",
  },
];

/** Sünnet (hacamat) günleri açıklaması — sık sorulan konu için sabit bilgi. */
export const SUNNET_GUNU_BILGISI =
  "Hacamat için tavsiye edilen sünnet günleri Hicri ayın 17, 19 ve 21. günleridir. ShifaHub randevu takviminde bu günler ayrıca işaretlenir.";

/**
 * Soruyla en alâkalı KB kayıtlarını anahtar-kelime örtüşmesine göre döndürür
 * (basit, deterministik retrieval — embedding yok). Skor = eşleşen anahtar sayısı.
 */
export function retrieveKb(query: string, limit = 2): KbEntry[] {
  const q = query.toLocaleLowerCase("tr");
  const scored = KULLIYAT_KB.map((e) => {
    let score = 0;
    for (const k of e.anahtarlar) if (q.includes(k)) score += 2;
    // Başlık kelimeleri de zayıf eşleşir
    for (const w of e.baslik.toLocaleLowerCase("tr").split(/\W+/)) {
      if (w.length > 3 && q.includes(w)) score += 1;
    }
    return { e, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.e);
}

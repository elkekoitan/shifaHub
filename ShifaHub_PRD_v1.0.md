# ShifaHub — Bütünsel Tedavi Yönetim Platformu

**Holistic Therapy Practice Management System**

**Product Requirements Document (PRD)**

Versiyon: 1.0 | Tarih: 7 Nisan 2026 | Hazırlayan: Hamza Turhan | Gizlilik: Şirkete Özel

---

## İÇİNDEKİLER

1. Yönetici Özeti
2. Vizyon ve Misyon
3. Mevzuat ve Uyumluluk Kapsamı
4. Kullanıcı Personaları
5. Kullanıcı Hikayeleri (User Stories)
6. Danışan (Hasta) Modülü
7. Eğitmen (Uygulama Uzmanı) Modülü
8. Randevu Yönetim Sistemi
9. Tedavi Protokolü Yönetimi
10. Danışan Dosyası ve Tıbbi Kayıtlar
11. Hicri Takvim Entegrasyonu
12. AI Chatbot ve Bilgi Külliyatı
13. Ses ve Multimedya Giriş Sistemi
14. Bildirim ve Hatırlatıcı Sistemi
15. Admin Dashboard
16. Güvenlik, KVKK ve Veri Koruma
17. Raporlama ve Analitik
18. Entegrasyonlar
19. Non-Functional Requirements
20. Ekranlar ve Wireframe Tanımları
21. Agent Sistemi Mimarisi
22. Yol Haritası (Roadmap)
23. Başarı Metrikleri (KPIs)
24. Riskler ve Azaltma Stratejileri
25. Stok ve Envanter Yönetimi
26. Finans ve Tahsilat Modülü
27. Komplikasyon ve Acil Durum Yönetimi
28. WhatsApp Entegrasyonu (Evolution API)
29. Telegram Bot Entegrasyonu
30. Coolify Deploy Mimarisi
31. Dinamik İçerik ve Bağlam Farkındalıklı AI
32. Sözlük (Glossary)

---

## 1. Yönetici Özeti

ShifaHub, Geleneksel ve Tamamlayıcı Tıp (GETAT) alanında faaliyet gösteren eğitmenler ve danışanlar için geliştirilen kapsamlı bir dijital practice management platformudur. Hacamat, sülük tedavisi, sujok, refleksoloji ve benzeri bütünsel tedavi yöntemlerini uygulayan sertifikalı eğitmenlerin danışan takibini, randevu yönetimini, tedavi protokollerini ve klinik kayıtlarını dijital ortamda yönetmelerini sağlar.

Platform, 27 Ekim 2014 tarihli GETAT Yönetmeliği, 6698 sayılı KVKK ve 10 Şubat 2026 tarihinde yayımlanan Türkiye GETAT Enstitüsü Yönetmeliği'ne tam uyumlu olarak tasarlanmıştır. Hicri takvim desteği, AI destekli bilgi külliyatı, ses-yazı dönüşümü ve multimedya dosya yönetimi ile sektörün dijital dönüşümünü hızlandırmayı hedefler.

Sistem, tam mobil uyumlu (PWA) bir web uygulaması olarak Coolify üzerinde deploy edilecek ve agent-based mimari ile kodlanacaktır.

---

## 2. Vizyon ve Misyon

**Vizyon:** Türkiye'de GETAT alanının dijital altyapısını oluşturan, eğitmen-danışan ilişkisini güçlendiren ve kanıta dayalı bütünsel sağlık hizmetlerinin standartlaşmasına katkı sağlayan lider platform olmak.

**Misyon:** GETAT eğitmenlerine güvenli, mevzuata uygun ve kullanıcı dostu bir dijital ortam sunarak danışan takibini kolaylaştırmak, tedavi kalitesini artırmak ve sektörün kurumsal hafızasını oluşturmak.

### 2.1 Temel Değer Önermeleri

- **Mevzuata Uyumluluk:** GETAT Yönetmeliği ve KVKK'ya tam uyum
- **Bütünsel Danışan Dosyası:** Tıbbi geçmiş, kan değerleri, tahliller, görseller tek merkezde
- **Akıllı Randevu:** Hicri/Miladi takvim, otomatik hatırlatma, ajanda yönetimi
- **AI Bilgi Külliyatı:** Sürekli büyüyen, kaynak bazlı bilgi bankası ve chatbot desteği
- **Multimedya Kayıt:** Ses, görüntü, dosya yükleme ve sesten-yazıya dönüşüm
- **Tedavi Protokolü Motoru:** Öncelik sıralama, öncesi/sonrası takip, çoklu şikayet yönetimi

---

## 3. Mevzuat ve Uyumluluk Kapsamı

### 3.1 GETAT Yönetmeliği (27.10.2014, Resmi Gazete: 29158)

- Uygulamalar sertifikalı tabip/diş tabibi sorumluluğunda yapılır (Madde 8)
- Tüm uygulamalar için hasta dosyası hazırlanır (Madde 12/3)
- Veriler elektronik ortamda Bakanlığa gönderilebilir (kişisel sağlık verileri mahremiyeti gözetilerek)
- Bilgilendirme ve tanıtım mevzuata uygun olmalıdır
- Her yeni uygulama için Bakanlıktan izin alınmalıdır

### 3.2 KVKK (6698 Sayılı Kanun) — Özel Nitelikli Kişisel Veriler

- Sağlık verileri özel nitelikli kişisel veridir (m.6/1) — En yüksek koruma rejimi
- Açık rıza zorunluluğu: İlgili kişinin bilgilendirilmesine dayanan, özgür iradeyle açıklanan rıza
- Battaniye rıza geçersizdir — Her veri işleme amacı için ayrı rıza alınmalı
- Teknik önlemler: Güçlü şifreleme, erişim logları, çok faktörlü kimlik doğrulama, DLP
- Veri ihlali bildirimi: En kısa sürede KVKK Kurulu ve ilgili kişilere bildirim zorunluluğu
- Veri saklama süresi: Sağlık verileri için 20-30 yıl (2025 değişikliği ile)
- Veri envanteri güncelleme ve düzenli iç denetim mekanizması zorunluluğu

### 3.3 Türkiye GETAT Enstitüsü Yönetmeliği (10.02.2026)

TÜSEB bünyesinde kurulan GETAT Enstitüsü, dijital sağlık ekosisteminin geliştirilmesine yönelik araştırma ve koordinasyon faaliyetlerini yürütecektir. ShifaHub, bu enstitünün dijital altyapı vizyonuyla uyumlu geliştirilecektir.

### 3.4 Önemli Yasal Not

> ⚠️ **TERMİNOLOJİ UYARISI:** Sistemde "doktor" terimi kullanılmayacaktır. GETAT uygulamaları sertifikalı tabip/diş tabibi sorumluluğunda, eğitimli eğitmenler tarafından gerçekleştirilir. Sistemde **"Eğitmen"**, **"Uygulama Uzmanı"** ve **"Danışan"** terimleri kullanılacaktır.

---

## 4. Kullanıcı Personaları

| Persona | Rol | Hedefler | Acı Noktaları |
|---------|-----|----------|---------------|
| Ayşe Eğitmen | Sertifikalı Hacamat Uzmanı | Danışanlarını dijital takip, tedavi protokollerini standartlaştırma | Kağıt dosyaların kaybolması, randevu karışıklıkları |
| Mehmet Danışan | Bütünsel tedavi arayan birey | Güvenilir eğitmen bulma, tedavi süreci takibi | Hangi tedavinin uygun olduğunu bilememek |
| Fatma Yönetici | Platform Admin | Eğitmen onayları, sistem güvenliği, raporlama | KVKK uyumluluk takibi, veri güvenliği |
| Ali Tabip | Sorumlu Hekim | GETAT uygulamalarını denetleme | Uzaktan gözetim zorluğu |

---

## 5. Kullanıcı Hikayeleri (User Stories)

### 5.1 Danışan (Hasta) User Stories

| ID | Kategori | Hikaye | Öncelik |
|----|----------|--------|---------|
| US-D001 | Kayıt ve Profil | Bir danışan olarak, ad-soyad, TC, doğum tarihi, boy, kilo, yaşadığım şehir, mevcut rahatsızlıklarım ve başvuru sebebimi doldurarak sisteme kaydolabilmeliyim. | Yüksek |
| US-D002 | Tahlil Yükleme | Bir danışan olarak, kan tahlillerimi ve tıbbi raporlarımı PDF/görsel olarak yükleyebilmeliyim. | Yüksek |
| US-D003 | Randevu Alma | Bir danışan olarak, uygun eğitmenlerden Hicri veya Miladi takvimde randevu alabilmeliyim. | Yüksek |
| US-D004 | Tedavi Geçmişi | Bir danışan olarak, geçmiş tedavilerimi, uygulanan yöntemleri ve sonuçları görebilmeliyim. | Yüksek |
| US-D005 | Randevu Hatırlatma | Bir danışan olarak, randevumdan 24 saat ve 1 saat önce SMS/push bildirim alabilmeliyim. | Orta |
| US-D006 | Eğitmen Arama | Bir danışan olarak, tedavi türü, konum ve değerlendirmeye göre eğitmen arayabilmeliyim. | Orta |
| US-D007 | Anamnez Formu | Bir danışan olarak, ilk başvuruda detaylı anamnez formu doldurabilmeliyim (aile öyküsü, alerji, kronik hastalıklar, kullandığım ilaçlar). | Yüksek |
| US-D008 | Mesajlaşma | Bir danışan olarak, eğitmenimle güvenli mesajlaşma kanalı üzerinden iletişim kurabilmeliyim. | Orta |
| US-D009 | AI Asistan | Bir danışan olarak, genel GETAT bilgilerini AI chatbot'tan sorabilmeliyim. | Düşük |
| US-D010 | Onam Formu | Bir danışan olarak, tedavi öncesinde dijital açık rıza/onam formunu imzalayabilmeliyim. | Yüksek |
| US-D011 | WhatsApp Randevu | Bir danışan olarak, WhatsApp üzerinden randevu hatırlatması alabilmeli ve "Onay/İptal" ile yanıt verebilmeliyim. | Orta |
| US-D012 | WhatsApp Chatbot | Bir danışan olarak, WhatsApp üzerinden ShifaHub AI asistanına GETAT soruları sorabilmeliyim. | Düşük |
| US-D013 | Telegram Bildirim | Bir danışan olarak, Telegram bot üzerinden randevu ve tedavi bildirimlerimi alabilmeliyim. | Düşük |

### 5.2 Eğitmen (Uygulama Uzmanı) User Stories

| ID | Kategori | Hikaye | Öncelik |
|----|----------|--------|---------|
| US-E001 | Profil ve Sertifika | Bir eğitmen olarak, uzmanlık alanlarımı (hacamat, sülük, sujok, refleksoloji), sertifikalarımı ve deneyimimi yükleyerek profilimi oluşturabilmeliyim. | Yüksek |
| US-E002 | Danışan Listesi | Bir eğitmen olarak, tüm danışanlarımı aranabilir/filtrelenebilir listede görebilmeliyim. | Yüksek |
| US-E003 | Anamnez Değerlendirme | Bir eğitmen olarak, danışanın doldurduğu anamnez formunu inceleyerek ek notlar ekleyebilmeliyim. | Yüksek |
| US-E004 | Tedavi Protokolü Oluşturma | Bir eğitmen olarak, danışanın çoklu şikayetlerini öncelik sırasına koyarak tedavi protokolü oluşturabilmeliyim. | Yüksek |
| US-E005 | Sesli Not | Bir eğitmen olarak, tedavi sırasında sesli not kaydedebilmeli ve bu otomatik olarak yazıya dönüştürülmelidir. | Yüksek |
| US-E006 | Takvim/Ajanda | Bir eğitmen olarak, günlük/haftalık/aylık randevularımı Hicri ve Miladi takvimde görebilmeliyim. | Yüksek |
| US-E007 | Toplu Randevu Görüntüleme | Bir eğitmen olarak, tüm randevularımı tarih aralığı, durum ve danışan bazında filtreleyebilmeliyim. | Yüksek |
| US-E008 | Öncesi/Sonrası Takip | Bir eğitmen olarak, uyguladığım tedavilerin öncesi ve sonrasındaki durumu aynı ekranda karşılaştırmalı görebilmeliyim. | Yüksek |
| US-E009 | Görsel Kayıt | Bir eğitmen olarak, tedavi bölgesinin fotoğrafını çekip dosyaya ekleyebilmeliyim. | Orta |
| US-E010 | Tavsiye Tedavi | Bir eğitmen olarak, uygulanmış tedavilerin yanına gelecek seans için tavsiye ettiğim tedavileri de ekleyebilmeliyim. | Yüksek |
| US-E011 | AI Chatbot | Bir eğitmen olarak, GETAT bilgi külliyatından soru sorabilmeliyim (akademik kaynak, hadis, tıbbi literatür). | Orta |
| US-E012 | Eskiye Dönük Kayıt | Bir eğitmen olarak, yeni kaydolan danışanlar için eskiye dönük tedavi geçmişi girebilmeliyim. | Orta |
| US-E013 | Kan Değerleri Takibi | Bir eğitmen olarak, danışanın zaman içindeki kan değerlerini grafik olarak takip edebilmeliyim. | Orta |
| US-E014 | Rapor Çıktısı | Bir eğitmen olarak, danışanın tedavi özetini PDF olarak çıkarabilmeliyim. | Düşük |
| US-E015 | Bağlam Farkındalıklı AI | Bir eğitmen olarak, tedavi notlarıma veya sesli kayıtlarıma hastalık veya bitki ismi girdiğimde, AI asistanın sağ panelde ilgili külliyat bilgilerini, hacamat noktalarını ve risk uyarılarını otomatik olarak listelemesini istiyorum. | Orta |
| US-E016 | Kontrendikasyon Uyarısı | Bir eğitmen olarak, danışanın ilaç kullanımı ile planlanan tedavi arasında risk varsa otomatik uyarı almak istiyorum. | Yüksek |
| US-E017 | Stok Takibi | Bir eğitmen olarak, elimdeki tıbbi malzeme (kupa, sülük, bitkisel yağ) stoğunu takip edebilmeli ve azalan ürünler için uyarı alabilmeliyim. | Orta |
| US-E018 | Manuel Ödeme Kaydı | Bir eğitmen olarak, danışandan aldığım ödemeyi (nakit/kart/havale) tedavi kaydına işleyebilmeliyim. | Yüksek |
| US-E019 | Acil Durum Raporlama | Bir eğitmen olarak, tedavi sırasında komplikasyon oluştuğunda tek tuşla acil durum raporu oluşturabilmeliyim. | Yüksek |
| US-E020 | WhatsApp Bildirim | Bir eğitmen olarak, danışanlarıma randevu hatırlatma ve tedavi notlarını WhatsApp üzerinden gönderebilmeliyim. | Orta |
| US-E021 | Telegram Bildirim | Bir eğitmen olarak, günlük ajanda özetimi ve acil bildirimleri Telegram bot üzerinden alabilmeliyim. | Düşük |

### 5.3 Admin User Stories

| ID | Kategori | Hikaye | Öncelik |
|----|----------|--------|---------|
| US-A001 | Eğitmen Onayı | Bir admin olarak, yeni eğitmen başvurularını sertifika kontrolü ile onaylayabilmeliyim. | Yüksek |
| US-A002 | Kullanıcı Yönetimi | Bir admin olarak, tüm kullanıcıları yönetebilmeli, hesap askıya alma/silme yapabilmeliyim. | Yüksek |
| US-A003 | KVKK Denetimi | Bir admin olarak, veri erişim loglarını inceleyebilmeli ve KVKK uyumluluk raporları çıkarabilmeliyim. | Yüksek |
| US-A004 | Külliyat Yönetimi | Bir admin olarak, AI bilgi külliyatına kaynak ekleyebilmeli, mevcut kaynakları düzenleyebilmeliyim. | Orta |
| US-A005 | Sistem Analizi | Bir admin olarak, platform kullanım istatistiklerini (aktif kullanıcı, randevu sayısı, tedavi dağılımı) dashboard'da görebilmeliyim. | Orta |
| US-A006 | Bildirim Yönetimi | Bir admin olarak, toplu bildirim ve duyuru gönderebilmeliyim. | Düşük |
| US-A007 | WhatsApp Yönetimi | Bir admin olarak, Evolution API instance durumunu izleyebilmeli, QR kod yenileme ve bağlantı sağlığını takip edebilmeliyim. | Orta |
| US-A008 | Telegram Bot Yönetimi | Bir admin olarak, Telegram bot komutlarını ve bildirim şablonlarını yapılandırabilmeliyim. | Düşük |
| US-A009 | Stok Raporları | Bir admin olarak, platform genelinde malzeme stok durumunu ve tüketim trendlerini görebilmeliyim. | Düşük |
| US-A010 | Komplikasyon İzleme | Bir admin olarak, tüm komplikasyon raporlarını izleyebilmeli ve Bakanlık bildirim gereksinimlerini takip edebilmeliyim. | Yüksek |

---

## 6. Danışan (Hasta) Modülü

### 6.1 Kayıt ve Onboarding Akışı

Danışan kayıt süreci KVKK açık rıza ile başlar:

- **Adım 1 — Temel Bilgiler:** Ad, soyad, TC kimlik no (isteğe bağlı), telefon, e-posta, doğum tarihi
- **Adım 2 — Fiziksel Bilgiler:** Boy (cm), kilo (kg), kan grubu, bilinen alerjiler
- **Adım 3 — Yaşam Bilgileri:** Yaşadığı şehir/ilçe, meslek, medeni durum
- **Adım 4 — Sağlık Öyküsü:** Mevcut rahatsızlıklar, kronik hastalıklar, geçirilmiş ameliyatlar
- **Adım 5 — Başvuru Sebebi:** GETAT'a başvuru nedeni, beklentiler
- **Adım 6 — KVKK Açık Rıza:** Dijital onam formu imzalama (her amaç için ayrı onay kutusu)
- **Adım 7 — Tahlil Yükleme (isteğe bağlı):** Kan tahlili, MR, röntgen yükleme

### 6.2 Danışan Dashboard Ekranı

- **Profilim:** Kişisel bilgiler, sağlık öyküsü özeti
- **Randevularım:** Aktif/geçmiş randevular, yeni randevu alma
- **Tedavi Geçmişim:** Tüm tedaviler kronolojik sırayla, öncesi/sonrası karşılaştırma
- **Tahlillerim:** Yüklenmiş tahlil dosyaları, kan değerleri trendi (grafik)
- **Mesajlar:** Eğitmenle güvenli iletişim
- **Bildirimler:** Randevu hatırlatmaları, tedavi notları
- **AI Asistan:** GETAT hakkında genel bilgi chatbot
- **Belgelerim:** Onam formları, raporlar, reçeteler

---

## 7. Eğitmen (Uygulama Uzmanı) Modülü

### 7.1 Eğitmen Kayıt ve Doğrulama

- Kişisel bilgiler ve iletişim bilgileri
- Uzmanlık alanları seçimi: Hacamat, Sülük Tedavisi, Sujok, Refleksoloji, Fitoterapi, Akupunktur, Kupa Terapi, Müzik Terapi, Hipnoz, Osteopati, Mezoterapi, Ozon Terapi, Kayropraktik, Homeopati, Proleterapi
- Sertifika yükleme (Sağlık Bakanlığı onaylı GETAT sertifikası)
- Bağlı olduğu sağlık kuruluşu / sorumlu tabip bilgisi
- Admin onay süreci (sertifika doğrulaması sonrası aktif olur)

### 7.2 Eğitmen Dashboard

- **Günlük Özet:** Bugünün randevuları, bekleyen danışan sayısı, acil notlar
- **Takvim/Ajanda:** Hicri + Miladi görünüm, günlük/haftalık/aylık, drag-drop randevu taşıma
- **Danışan Listesi:** Ad, son tedavi tarihi, aktif şikayet, durum badge'leri ile aranabilir liste
- **Tedavi İş Akışı:** Bekleyen protokoller, devam eden tedaviler, tamamlananlar
- **Hızlı Kayıt:** Ses veya yazı ile hızlı not ekleme butonu
- **Bilgi Külliyatı Chatbot:** Sağ panel veya floated widget olarak her zaman erişilebilir
- **Raporlarım:** Danışan bazında tedavi özetleri, istatistikler
- **Mesajlar:** Danışanlardan gelen mesajlar

### 7.3 Danışan Detay Ekranı (Eğitmen Görünümü)

Eğitmen bir danışanı seçtiğinde tabbed layout ile:

| Sekme | İçerik |
|-------|--------|
| Anamnez | Doldurulmuş anamnez formu, sağlık öyküsü, aile öyküsü, alerjiler |
| Tahliller | Yüklenen tahlil dosyaları, kan değerleri tablosu/grafiği, referans aralıkları |
| Tedavi Protokolü | Aktif protokol, şikayet öncelik sıralaması, uygulanacak tedaviler listesi |
| Tedavi Geçmişi | Önceki tüm tedaviler: tarih, yöntem, uygulama detayları, eğitmen notları |
| Öncesi/Sonrası | Fotoğraf ve durum karşılaştırması (split-view) |
| Medya Dosyaları | Tüm yüklenen resimler, ses kayıtları, belgeler |
| Notlar | Eğitmen notları (ses kaydı + transkript) |
| Tavsiyeler | Gelecek seans için önerilen tedaviler |

---

## 8. Randevu Yönetim Sistemi

### 8.1 Randevu Alma Akışı (Danışan Tarafı)

- Danışan tedavi türü seçer (hacamat, sülük vb.)
- Uygun eğitmenlerin müsait saatleri görüntülenir (Hicri/Miladi takvim seçeneği)
- Tarih ve saat seçimi yapılır
- Başvuru sebebi/not eklenir
- Randevu onayı — SMS + Push + E-posta bildirimi
- Randevu hatırlatma — 24 saat önce + 1 saat önce otomatik bildirim
- İptal/değişiklik — 48 saate kadar ücretsiz iptal, 24 saat içinde uyarı ile iptal

### 8.2 Ajanda Yönetimi (Eğitmen Tarafı)

- **Günlük Görünüm:** Saat bazında randevular, renkli durum kodları (onaylanmış, bekleyen, iptal)
- **Haftalık Görünüm:** 7 günlük grid layout, yoğunluk göstergesi
- **Aylık Görünüm:** Takvim üzerinde randevu sayıları, Hicri takvim paralel gösterim
- **Müsaitlik Ayarları:** Çalışma saatleri, tatil günleri, öğle arası, Cuma namazı molaları
- **Toplu Görüntüleme:** Filtreleme (tarih aralığı, durum, tedavi türü, danışan), CSV export
- **Eskiye Dönük Kayıt:** Geçmiş tarihli randevu ve tedavi kaydı girişi (retroactive entry)
- **Drag & Drop:** Randevu taşıma ve süre ayarlama
- **Tekrarlayan Randevu:** Haftalık/2 haftalık tedavi serileri için otomatik oluşturma

### 8.3 Randevu Durum Akışı

```
Talep Edildi → Onaylandı → Hatırlatıldı → Danışan Geldi → Tedavi Uygulandı → Tamamlandı
                                          ↘ İptal Edildi
                                          ↘ Gelmedi (No-Show)
                                          ↘ Ertelendi
```

---

## 9. Tedavi Protokolü Yönetimi

### 9.1 Protokol Oluşturma Akışı

Danışanın birden fazla şikayeti olabilir. Eğitmen bu şikayetleri öncelik sırasına koyarak tedavi planı oluşturur:

- **Adım 1:** Danışanın şikayetlerini listeleme (örn: bel ağrısı, migren, sindirim problemi)
- **Adım 2:** Her şikayete öncelik atama (1-Acil, 2-Yüksek, 3-Normal, 4-Takip)
- **Adım 3:** Her şikayet için uygulanacak tedavi yöntemini seçme
- **Adım 4:** Tedavi sırasını belirleme (hangisi önce başlayacak)
- **Adım 5:** Her tedavi için tahmini seans sayısı ve aralık belirleme
- **Adım 6:** Tavsiye edilen destekleyici uygulamaları ekleme

### 9.2 Tedavi Kaydı Detayları

| Alan | Açıklama |
|------|----------|
| Tedavi Tarihi | Hicri + Miladi tarih otomatik |
| Tedavi Yöntemi | Hacamat, Sülük, Sujok, Refleksoloji vb. |
| Uygulama Bölgesi | Vücut haritası üzerinde işaretleme + metin |
| Uygulama Detayları | Kupa sayısı, sülük sayısı, noktalar, süre |
| Eğitmen Notu | Yazılı veya sesli kayıt (transkript ile) |
| Öncesi Görsel | Tedavi öncesi fotoğraf |
| Sonrası Görsel | Tedavi sonrası fotoğraf |
| Yan Etki/Gözlem | Tedavi sırası/sonrası gözlemler |
| Tavsiye | Sonraki seans için önerilen tedavi |
| Danışan Geri Bildirimi | Danışanın tedavi sonrası öz değerlendirmesi |

---

## 10. Danışan Dosyası ve Tıbbi Kayıtlar

### 10.1 Anamnez Formu Alanları

| Bölüm | Alanlar |
|-------|---------|
| Kişisel Bilgiler | Ad-soyad, TC, doğum tarihi, cinsiyet, medeni durum, meslek |
| Fiziksel Ölçümler | Boy, kilo, BMİ, tansiyon, nabız |
| Tıbbi Geçmiş | Kronik hastalıklar, geçirilmiş ameliyatlar, hastane yatışları |
| İlaç Kullanımı | Mevcut ilaçlar, vitamin/takviyeler, bitkisel ürünler |
| Alerji Bilgisi | İlaç alerjileri, gıda alerjileri, diğer alerjiler |
| Aile Öyküsü | Ailede görülen hastalıklar (diyabet, kalp, kanser vb.) |
| Yaşam Tarzı | Beslenme düzeni, egzersiz, uyku, stres düzeyi, sigara/alkol |
| Şikayetler | Mevcut şikayetler, başlangıç tarihi, şiddeti (1-10), tetikleyiciler |
| Başvuru Sebebi | GETAT'a neden başvurduğu, beklentileri |
| Önceki GETAT Deneyimi | Daha önce aldığı bütünsel tedaviler ve sonuçları |

### 10.2 Kan Değerleri Takip Modülü

Danışanın tahlil sonuçları tarih bazında kaydedilir ve grafik olarak izlenir:

- **Tam Kan Sayımı:** Hemoglobin, Hematokrit, Lökosit, Trombosit, Eritrosit
- **Biyokimya:** Glukoz, Üre, Kreatinin, AST, ALT, Kolesterol (Total, LDL, HDL), Trigliserit
- **Hormon:** TSH, T3, T4, Vitamin D, Vitamin B12, Ferritin, Demir
- **Sedimantasyon, CRP, HbA1c**
- **Özel parametreler:** Eğitmen tarafından eklenen özel değerler
- **Referans Aralıkları:** Yaş ve cinsiyete göre otomatik referans değerleri

### 10.3 Dosya Kabul Formatları

| Tip | Formatlar | Kullanım Alanı |
|-----|-----------|---------------|
| Görsel | JPG, PNG, HEIF, WebP | Tedavi öncesi/sonrası, tahlil görseli |
| Belge | PDF, DOCX | Tıbbi raporlar, tahlil sonuçları |
| Ses | MP3, WAV, M4A, OGG | Eğitmen sesli notları |
| Video | MP4, WebM (maks 100MB) | Tedavi süreci kaydı (isteğe bağlı) |

---

## 11. Hicri Takvim Entegrasyonu

Sistem Hicri ve Miladi takvimi eş zamanlı olarak destekler. Kullanıcı tercihine göre birincil takvim seçilebilir.

### 11.1 Teknik Detaylar

- **Hicri-Miladi dönüşüm:** Umm al-Qura takvim algoritması (Suudi Arabistan resmi takvimi)
- **JavaScript kütüphanesi:** `Intl.DateTimeFormat` ile `islamic-umalqura` calendar desteği
- **Paralel gösterim:** Takvim UI'da her tarih altında diğer takvimdeki karşılık
- **Özel günler:** Ramazan, Kurban Bayramı, Mevlid Kandili gibi dini günler işaretlenir
- **Randevu kaydı:** Her iki takvim formatında saklanır
- **Hacamat özel günleri:** Ayın 17, 19, 21. günleri (Hicri) otomatik işaretlenir (Sünnet günleri)

---

## 12. AI Chatbot ve Bilgi Külliyatı

### 12.1 Külliyat Kapsamı

Sistemin en kritik ve sürekli büyüyen bileşeni olan bilgi külliyatı:

- **Tıbbi Literatür:** Hacamat, sülük tedavisi, sujok, refleksoloji akademik yayınları
- **GETAT Mevzuatı:** Yönetmelikler, genelgeler, KVKK rehberleri
- **Hadis Külliyatı:** Tıbbi hadisler (Buhari, Müslim, Tirmizi, İbn Mace)
- **Tıbb-ı Nebevi Kaynakları:** İbn Kayyim el-Cevziyye, İbn Sina, El-Kanun fi't-Tıbb
- **Modern Araştırmalar:** PubMed, Google Scholar GETAT makaleleri
- **Klinik Protokoller:** Onaylanmış tedavi protokolleri ve uygulama rehberleri
- **Bitki Monografları:** WHO, EMA bitki monografları
- **Vaka Çalışmaları:** Anonimleştirilmiş başarılı tedavi vakaları

### 12.2 Chatbot Mimarisi

- **RAG (Retrieval-Augmented Generation):** Külliyat üzerinden vektör arama + LLM yanıt üretimi
- **Vector Database:** Qdrant veya Pinecone ile embedding storage
- **Kaynak Referanslama:** Her yanıtta kaynak belirtilir (kitap, makale, hadis numarası)
- **Rol Bazlı Erişim:** Danışanlara genel bilgi, eğitmenlere teknik/klinik düzeyde yanıt
- **Güvenlik Katmanı:** Tıbbi teşhis koymaz, sadece bilgilendirme yapar, her yanıtta feragat notu
- **Sürekli Öğrenme:** Admin tarafından yeni kaynak eklendiğinde otomatik re-indexing
- **Conversation Memory:** Seans içi bağlam takibi

### 12.3 Chatbot Kullanım Senaryoları

| Kullanıcı | Örnek Soru | Yanıt Tipi |
|-----------|------------|------------|
| Danışan | "Hacamat nedir, hangi durumda faydalıdır?" | Genel bilgi + hadis referansı + dikkat notları |
| Eğitmen | "Lumbar disk hernisi için hacamat noktaları nelerdir?" | Anatomik noktalar + literatür referansı + protokol önerisi |
| Eğitmen | "Sülük tedavisinde kontrendikasyonlar" | Kesin/göreceli kontrendikasyonlar + mevzuat notu |
| Admin | "Bu ay en çok sorulan konu ne?" | İstatistik + trend analizi |

---

## 13. Ses ve Multimedya Giriş Sistemi

### 13.1 Sesli Not Sistemi

- Tek dokunma ile ses kaydı başlatma (mobilde native mic API)
- Gerçek zamanlı Speech-to-Text (STT): Türkçe dil desteği ile Whisper API
- Transkript düzenleme: Otomatik yazıya dönüşen metin eğitmen tarafından düzenlenebilir
- Ses kaydı + transkript birlikte saklanır (original audio korunur)
- Ses kaydına zaman damgası (timestamp) eklenir
- Offline mod: İnternet yokken kayıt yapılır, bağlantıda transkripsiyon tetiklenir

### 13.2 Görsel Kayıt Sistemi

- Kamera ile doğrudan çekim (mobilde native camera API)
- Galeriden yükleme
- Otomatik kompresyon (kaliteyi koruyarak dosya boyutu optimizasyonu)
- EXIF metadata temizleme (KVKK — konum bilgisi kaldırılır)
- Annotation: Görsel üzerine işaretleme, ok, daire çizme
- Öncesi/Sonrası eşleştirme: Aynı bölgenin farklı tarihlerdeki görselleri otomatik eşleşir

---

## 14. Bildirim ve Hatırlatıcı Sistemi

| Bildirim | Zamanlama | Kanal | Hedef |
|----------|-----------|-------|-------|
| Randevu Hatırlatma | 24 saat + 1 saat önce | Push, SMS, E-posta | Danışan + Eğitmen |
| Randevu Onayı | Anında | Push, SMS | Danışan |
| Randevu İptali | Anında | Push, SMS | Her iki taraf |
| Yeni Danışan | Anında | Push, E-posta | Eğitmen |
| Tahlil Yüklendi | Anında | Push | Eğitmen |
| Tedavi Notu Eklendi | Anında | Push | Danışan |
| Kontrol Randevusu | Tedaviden 7 gün sonra | Push, SMS | Danışan |
| Hacamat Sünnet Günleri | Hicri 17/19/21 öncesi | Push | Eğitmen |
| KVKK Rıza Yenileme | Yıllık | E-posta | Danışan |
| WhatsApp Randevu Onay | Randevu sonrası | WhatsApp (Evolution API) | Danışan |
| WhatsApp Tedavi Özeti | Tedavi sonrası | WhatsApp (Evolution API) | Danışan |
| Telegram Günlük Ajanda | Her sabah 08:00 | Telegram Bot | Eğitmen |
| Telegram Acil Durum | Anında | Telegram Bot | Admin + Eğitmen |
| Stok Uyarısı | Stok minimuma düştüğünde | Push, Telegram | Eğitmen |
| Komplikasyon Bildirimi | Anında | Push, E-posta, Telegram | Admin |

---

## 15. Admin Dashboard

### 15.1 Dashboard Bileşenleri

- **Genel Bakış:** Toplam danışan, aktif eğitmen, günlük randevu, aylık büyüme
- **Eğitmen Yönetimi:** Başvuru onayı, sertifika doğrulama, hesap durumu
- **Danışan Yönetimi:** Hesap askıya alma, veri silme talepleri (KVKK hakları)
- **Tedavi Analizi:** Tedavi türü dağılımı, en yaygın şikayetler, başarı oranı trendi
- **Külliyat Yönetimi:** Kaynak ekleme/düzenleme, chatbot performans metrikleri
- **KVKK Panosu:** Veri erişim logları, açık rıza durumları, veri ihlali raporlama
- **Bildirim Merkezi:** Toplu duyuru, sistem bildirimleri, push kampanyaları
- **Sistem Sağlığı:** Server durumu, hata logları, API yanıt süreleri
- **Gelir Raporları:** Abonelik durumları, ödeme takibi (ileride)

### 15.2 Admin Rolleri

| Rol | Yetkiler |
|-----|----------|
| Süper Admin | Tüm yetkiler, sistem konfigürasyonu, rol atama |
| KVKK Sorumlusu | Veri erişim logları, rıza yönetimi, ihlal raporlama |
| Külliyat Editörü | Bilgi külliyatı kaynak yönetimi, chatbot eğitimi |
| Destek Uzmanı | Kullanıcı destek talepleri, hesap sorunları |

---

## 16. Güvenlik, KVKK ve Veri Koruma

### 16.1 Kimlik Doğrulama ve Yetkilendirme

- JWT + Refresh Token bazlı oturum yönetimi
- Çok Faktörlü Kimlik Doğrulama (MFA): Eğitmenler için zorunlu, danışanlar için isteğe bağlı
- Role-Based Access Control (RBAC): Danışan, Eğitmen, Sorumlu Tabip, Admin rolleri
- Row-Level Security (RLS): Her kullanıcı sadece kendi verilerini görür
- Session timeout: 30 dakika inaktivite sonrası otomatik çıkış
- Brüte Force koruması: Rate limiting + CAPTCHA

### 16.2 Veri Koruma

- **Şifreleme:** AES-256 at-rest + TLS 1.3 in-transit
- **Sağlık verileri:** Ayrı şifreleme anahtarları ile ek koruma
- **Erişim Logları:** Kim, ne zaman, hangi veriye erişti (audit trail)
- **Veri Maskeleme:** Danışan TC no, telefon gibi hassas alanlar maskeli gösterilir
- **Otomatik Yedekleme:** Günlük encrypted backup, 30 gün retention
- **Veri Silme:** KVKK m.7 uyarınca talep üzerine geri dönüşsüz silme
- **Veri Taşınabilirlik:** Danışan verilerinin JSON/PDF olarak exportı (KVKK m.11)
- **Veri İhlal Müdahale Planı:** 72 saat içinde KVKK Kurulu'na bildirim süreci

### 16.3 Açık Rıza Yönetimi

- Her amaç için ayrı onay kutusu (battaniye rıza geçersiz)
- Rıza versiyon takibi: Politika değişikliklerinde yeniden rıza talebi
- Rıza geri çekme: Tek tıkla rıza iptal ve sonuçlarının bilgilendirilmesi
- Rıza erişim kaydı: Her rıza işlemine tarih-saat damgası ve IP kaydı
- Dijital İmza: E-imza veya OTP doğrulaması ile rıza onayı

---

## 17. Raporlama ve Analitik

- **Eğitmen Performans Raporu:** Seans sayısı, danışan memnuniyeti, tedavi başarı oranı
- **Danışan İlerleme Raporu:** Tedavi öncesi/sonrası karşılaştırma, kan değerleri trendi
- **Tedavi Dağılım Raporu:** En çok uygulanan tedaviler, şikayet-tedavi eşleşme analizi
- **Randevu Analizi:** Doluluk oranı, no-show oranı, ortalama bekleme süresi
- **KVKK Uyumluluk Raporu:** Açık rıza durumları, veri erişim logları, silme talepleri
- **Chatbot Analizi:** En çok sorulan sorular, yanıt kalitesi, kullanım istatistikleri
- **Finansal Rapor:** Gelir-gider, abonelik metrikleri (Phase 2)
- **Export Formatları:** PDF, CSV, Excel

---

## 18. Entegrasyonlar

| Entegrasyon | Sağlayıcı | Kullanım |
|-------------|-----------|----------|
| SMS Gateway | Netgsm / Iletimerkezi | Randevu hatırlatma, OTP doğrulama |
| Push Notification | Firebase Cloud Messaging | Mobil bildirimler (PWA) |
| E-posta | Resend / AWS SES | Bildirimler, raporlar |
| STT (Speech-to-Text) | OpenAI Whisper API | Sesli not transkripsiyon |
| AI/LLM | Claude API (Anthropic) | Chatbot, bilgi külliyatı RAG |
| Vector DB | Qdrant / Pinecone | Külliyat embedding storage |
| Object Storage | MinIO (self-hosted) | Medya dosyaları (KVKK — yurt içi) |
| Hicri Takvim | Intl API + ummalqura | Hicri-Miladi dönüşüm |
| WhatsApp | Evolution API (self-hosted) | Randevu hatırlatma, chatbot, bildirimler |
| Telegram | Telegram Bot API | Eğitmen ajanda, acil bildirim, admin alerts |
| Ödeme (Phase 2) | Param / iyzico | Ödeme alımı |

---

## 19. Non-Functional Requirements

| Kategori | Gereksinim |
|----------|------------|
| Performans | Sayfa yüklenme < 2sn, API yanıt < 500ms (P95) |
| Ölçeklenebilirlik | 1000 eş zamanlı kullanıcı, yatay ölçekleme (Docker Swarm) |
| Kullanılabilirlik | %99.5 uptime SLA, mobil-first responsive tasarım |
| Erişilebilirlik | WCAG 2.1 AA uyumluluk, ekran okuyucu desteği |
| Güvenlik | OWASP Top 10 koruma, yıllık penetrasyon testi |
| Veri Saklama | Sağlık verileri 30 yıl, genel veriler 10 yıl retention |
| Lokalizasyon | Türkçe (birincil), İngilizce, Arapça (Phase 2) |
| PWA | Service Worker, offline cache, app-like deneyim, home screen shortcut |
| SEO | SSR/SSG ile arama motoru uyumluluk (genel sayfalar) |
| Monitoring | Uptime, hata oranı, API latency takibi (Grafana) |

---

## 20. Ekranlar ve Wireframe Tanımları

### 20.1 Danışan Ekranları

| ID | Ekran | Açıklama |
|----|-------|----------|
| D-SCR-001 | Kayıt Formu | Multi-step wizard, KVKK onayı, progress bar |
| D-SCR-002 | Giriş | Telefon/e-posta + şifre, sosyal giriş (isteğe bağlı) |
| D-SCR-003 | Dashboard | Card-based layout, randevularım, tedavi özeti, bildirimler |
| D-SCR-004 | Profil | Kişisel bilgiler, sağlık öyküsü, ayarlar |
| D-SCR-005 | Eğitmen Arama | Filtreler (alan, konum, puan), card listing |
| D-SCR-006 | Randevu Alma | Takvim seçici (Hicri/Miladi toggle), saat slotları |
| D-SCR-007 | Randevularım | Liste + takvim görünümü, durum filtreleme |
| D-SCR-008 | Tedavi Geçmişi | Timeline görünüm, detay modal |
| D-SCR-009 | Tahlillerim | Liste + grafik görünümü, yükleme alanı |
| D-SCR-010 | Mesajlar | Chat arayüzü, eğitmen listesi |
| D-SCR-011 | AI Asistan | Chatbot widget, soru-cevap arayüzü |
| D-SCR-012 | Belgelerim | Dosya listesi, onam formları, indirme |

### 20.2 Eğitmen Ekranları

| ID | Ekran | Açıklama |
|----|-------|----------|
| E-SCR-001 | Dashboard | Günlük özet, randevular, hızlı erişim butonları |
| E-SCR-002 | Takvim/Ajanda | Gün/hafta/ay görünüm, Hicri/Miladi, drag-drop |
| E-SCR-003 | Danışan Listesi | Aranabilir tablo, filtre, son tedavi bilgisi |
| E-SCR-004 | Danışan Detay | Tabbed layout: Anamnez, Tahliller, Protokol, Geçmiş, Medya |
| E-SCR-005 | Tedavi Protokolü | Şikayet öncelik sıralama, tedavi planı oluşturma |
| E-SCR-006 | Tedavi Kayıt | Form: yöntem, bölge, detay, ses notu, fotoğraf |
| E-SCR-007 | Öncesi/Sonrası | Split-view karşılaştırma, tarih seçici |
| E-SCR-008 | Sesli Not | Kayıt butonu, dalga formu, transkript editör |
| E-SCR-009 | Kan Değerleri | Grafik + tablo, referans aralıkları, trend gösterge |
| E-SCR-010 | Chatbot | Sağ panel veya full-screen, kaynak referanslı yanıt |
| E-SCR-011 | Toplu Randevu | Grid/liste görünüm, filtre, export |
| E-SCR-012 | Profil/Ayarlar | Sertifikalar, çalışma saatleri, bildirim tercihleri |
| E-SCR-013 | Raporlar | PDF rapor üretimi, istatistik grafikleri |
| E-SCR-014 | Eskiye Dönük Kayıt | Geçmiş tarih seçicili tedavi giriş formu |

### 20.3 Admin Ekranları

| ID | Ekran | Açıklama |
|----|-------|----------|
| A-SCR-001 | Dashboard | KPI kartları, grafikler, hızlı özet |
| A-SCR-002 | Eğitmen Yönetimi | Başvuru listesi, sertifika inceleme, onay/red |
| A-SCR-003 | Danışan Yönetimi | Kullanıcı listesi, hesap işlemleri, KVKK hakları |
| A-SCR-004 | Külliyat Yönetimi | Kaynak listesi, ekleme/düzenleme, embedding durumu |
| A-SCR-005 | KVKK Panosu | Erişim logları, rıza raporları, ihlal takibi |
| A-SCR-006 | Bildirim Yönetimi | Toplu bildirim gönderme, şablon yönetimi |
| A-SCR-007 | Sistem Ayarları | Genel konfig, rol yönetimi, entegrasyon ayarları |
| A-SCR-008 | Raporlar | Platform-çapında istatistikler, export |

---

## 21. Agent Sistemi Mimarisi

Proje, agentic coding paradigmasıyla geliştirilecektir. Her ana modül için specialized agent'ler tanımlanır:

| Agent | Sorumluluk |
|-------|------------|
| Auth Agent | Kimlik doğrulama, KVKK rıza akışları, MFA, session management |
| Booking Agent | Randevu CRUD, takvim çakışma kontrolü, hatırlatma tetikleme |
| Clinical Agent | Tedavi protokolü, anamnez, kan değerleri, dosya yönetimi |
| Media Agent | Dosya yükleme, kompresyon, STT transkripsiyon, EXIF temizleme |
| Knowledge Agent | RAG pipeline, embedding, kaynak yönetimi, chatbot yanıt üretimi |
| Notification Agent | SMS, push, e-posta gönderimi, şablon yönetimi, zamanlama |
| Analytics Agent | Rapor üretimi, metrik hesaplama, dashboard veri beslemesi |
| Calendar Agent | Hicri-Miladi dönüşüm, özel gün hesaplama, takvim senkronizasyonu |
| Compliance Agent | KVKK log takibi, rıza durumu kontrolü, veri saklama süresi yönetimi |
| WhatsApp Agent | Evolution API instance yönetimi, mesaj gönderimi, webhook dinleme, chatbot routing |
| Telegram Agent | Bot komut işleme, ajanda bildirimi, acil durum alert, admin raporlama |
| Inventory Agent | Stok takibi, minimum stok uyarısı, tüketim analizi, sipariş önerisi |
| Emergency Agent | Komplikasyon raporlama, acil durum protokolü, Bakanlık bildirim tetikleme |
| Finance Agent | Ödeme kaydı, tahsilat takibi, gelir raporlaması, fatura üretimi |

### 21.1 Agent İletişim Modeli

- **Event-Driven Architecture:** Agent'ler message queue üzerinden haberleşir
- **Orchestrator Pattern:** Ana iş akışları orchestrator agent tarafından koordine edilir
- **Her agent kendi bounded context'inde çalışır** (DDD prensibi)
- **Agent'ler bağımsız deploy edilebilir** (microservice-ready)
- **Shared event bus:** BullMQ (Redis-backed) ile asenkron iş yönetimi

---

## 22. Yol Haritası (Roadmap)

| Faz | Kapsam |
|-----|--------|
| **Phase 1 — MVP (Ay 1-3)** | Kayıt/giriş, profil, anamnez, randevu alma/yönetme, temel tedavi kaydı, Hicri takvim, bildirimler, KVKK altyapısı, PWA shell |
| **Phase 2 — Core (Ay 4-6)** | Tedavi protokolü motoru, kan değerleri takibi, sesli not + STT, görsel kayıt + annotation, öncesi/sonrası karşılaştırma, admin dashboard |
| **Phase 3 — AI (Ay 7-9)** | Bilgi külliyatı altyapısı, RAG chatbot, kaynak yönetimi, eğitmen/danışan chatbot arayüzleri |
| **Phase 4 — Growth (Ay 10-12)** | Ödeme entegrasyonu, raporlama, eğitmen marketplace, çoklu dil desteği, API marketplace |
| **Phase 5 — Scale (Yıl 2)** | Telehealth (video görüşme), IoT entegrasyon (giyilebilir cihaz verileri), Bakanlık entegrasyonu, uluslararasılaşma |

---

## 23. Başarı Metrikleri (KPIs)

| Metrik | Tanım | Hedef |
|--------|-------|-------|
| Kullanıcı Büyümesi | Aylık yeni kayıt sayısı | Phase 1: 100 danışan + 20 eğitmen |
| Engagement | Aylık aktif kullanıcı / toplam kullanıcı | %60 MAU oranı |
| Randevu Tamamlama | Onaylanan / tamamlanan randevu oranı | %85 tamamlama |
| No-Show Oranı | Gelmeme oranı | <%10 |
| Tedavi Kayıt Oranı | Dijital kayıt yapılan tedavi yüzdesi | %90 |
| Chatbot Memnuniyeti | Kullanıcı değerlendirmesi | 4.0/5.0 |
| Sayfa Yüklenme | P95 yüklenme süresi | <2 saniye |
| KVKK Uyum | Açık rıza tamamlama oranı | %100 |

---

## 24. Riskler ve Azaltma Stratejileri

| Risk | Etki | Azaltma Stratejisi |
|------|------|---------------------|
| KVKK İhlali | Yüksek | Penetrasyon testi, KVKK danışmanlığı, düzenli denetim |
| Eğitmen Adaptasyonu | Orta | Basit UX, video eğitim, onboarding wizard |
| Mevzuat Değişikliği | Orta | Modüler yapı, hızlı güncelleme kapasitesi |
| AI Hataları | Orta | Feragat notu, insan denetimi, hallucination guard |
| Veri Kaybı | Yüksek | Günlük backup, disaster recovery planı, multi-AZ |
| Performans | Düşük | CDN, caching, lazy loading, performance budget |
| Rekabet | Düşük | Niş odaklı (GETAT), Hicri takvim ve külliyat ile farklılaşma |

---

## 25. Stok ve Envanter Yönetimi

Hacamat, sülük tedavisi ve fitoterapi gibi uygulamalar fiziksel malzeme gerektirir. Eğitmenlerin malzeme stoğunu dijital ortamda takip etmesi operasyonel sürdürülebilirlik için kritiktir.

### 25.1 Takip Edilen Malzeme Kategorileri

| Kategori | Örnek Malzemeler | Takip Birimi |
|----------|-----------------|-------------|
| Kupa/Bardak | Hacamat kupaları (çeşitli boyutlar) | Adet |
| Tıbbi Sülük | Hirudo medicinalis, Hirudo verbana | Adet (canlı stok) |
| Sarf Malzeme | Neşter, pamuk, antiseptik, eldiven | Adet/Kutu |
| Bitkisel Ürünler | Yağlar, çaylar, kremler, tinkürler | ml/gr |
| İğne/Akupunktur | Akupunktur iğneleri (çeşitli boyutlar) | Adet/Kutu |

### 25.2 Stok Yönetimi Özellikleri

- **Minimum Stok Uyarısı:** Her malzeme için minimum stok seviyesi tanımlanır, altına düşünce otomatik bildirim (Push + Telegram)
- **Tüketim Kaydı:** Tedavi kaydına bağlı otomatik stok düşümü (örn: hacamat = 1 neşter + X kupa + pamuk)
- **Sülük Özel Takibi:** Canlı sülük sayısı, kullanım sonrası imha kaydı, tedarikçi bilgisi, son kullanma/sağlık durumu
- **Parti/Lot Takibi:** Bitkisel ürünlerde lot numarası, üretim/son kullanma tarihi
- **Tedarikçi Yönetimi:** Tedarikçi listesi, son sipariş tarihi, fiyat karşılaştırma
- **Tüketim Raporu:** Aylık/haftalık malzeme tüketim analizi, maliyet hesaplaması
- **Barcode/QR:** Malzeme girişinde barkod/QR tarama desteği (mobil kamera)

---

## 26. Finans ve Tahsilat Modülü

### 26.1 MVP Aşaması — Manuel Ödeme Kaydı

Online ödeme entegrasyonu Phase 2'de planlanmakla birlikte, MVP'den itibaren eğitmenin ödeme durumunu kaydetmesi gerekir:

- **Ödeme Yöntemleri:** Nakit, Kredi Kartı, Havale/EFT, Cüzdan (kayıt bazlı)
- **Tedavi-Ödeme Eşleştirme:** Her tedavi kaydına ödeme durumu eklenir (Ödendi, Bekliyor, Kısmi, Ücretsiz)
- **Makbuz/Dekont:** Basit dijital makbuz oluşturma (PDF)
- **Ödeme Geçmişi:** Danışan bazında ödeme kronolojisi
- **Günlük Kasa Raporu:** Eğitmenin günlük tahsilat özeti

### 26.2 Phase 2 — Online Ödeme

- iyzico / Param entegrasyonu
- Otomatik fatura oluşturma
- Taksit seçenekleri
- Abonelik/paket satışı (örn: 5 seans hacamat paketi)

### 26.3 Finansal Raporlar

- **Eğitmen Gelir Raporu:** Günlük/haftalık/aylık gelir, tedavi türüne göre dağılım
- **Tahsilat Durumu:** Bekleyen ödemeler, vadesi geçmiş tutarlar
- **Malzeme Maliyet Analizi:** Stok tüketimi x birim fiyat = tedavi başına maliyet
- **Kârlılık Analizi:** Gelir - malzeme maliyeti = tedavi başına net kazanç

---

## 27. Komplikasyon ve Acil Durum Yönetimi

### 27.1 Acil Durum Raporlama

Tedavi sırasında ciddi komplikasyon (bayılma, alerjik reaksiyon, aşırı kanama vb.) durumunda izlenecek dijital protokol:

- **Tek Tuş Acil Durum:** Tedavi kayıt ekranında kırmızı "Acil Durum" butonu
- **Hızlı Form:** Komplikasyon tipi (dropdown), şiddeti (1-5), alınan müdahale, zaman damgası
- **Otomatik Bildirimler:** Admin'e anında Telegram + Push + E-posta
- **Fotoğraf/Video Ekleme:** Kanıt niteliğinde görsel kayıt
- **112 Bilgi Kartı:** Danışanın temel sağlık bilgileri + alerji + ilaç listesi hazır gösterim
- **Takip Formu:** Komplikasyon sonrası izleme kaydı (24h, 48h, 1 hafta)

### 27.2 Komplikasyon Tipleri

| Tip | Şiddet | Protokol |
|-----|--------|----------|
| Hafif Yan Etki | 1-2 | Kayıt + danışan bilgilendirme |
| Orta Komplikasyon | 3 | Kayıt + sorumlu tabip bilgilendirme |
| Ciddi Komplikasyon | 4 | Kayıt + tabip + admin bildirim + takip |
| Acil Durum | 5 | 112 yönlendirme + tüm bildirimler + Bakanlık rapor hazırlığı |

### 27.3 Onam İptali Operasyonel Yansıması

Danışan KVKK rızasını geri çektiğinde sistemin davranışı:

- **Aktif Tedavi Protokolü Varsa:** Protokol otomatik askıya alınır, eğitmene anlık bildirim gönderilir
- **Bekleyen Randevular:** Otomatik iptal edilir, her iki tarafa bildirim
- **Veri Erişimi:** Eğitmenin danışan verilerine erişimi derhal kısıtlanır
- **Saklama Süresi:** Yasal zorunluluk kapsamındaki veriler (tedavi kayıtları) saklanır, kişisel veriler silinir
- **Grace Period:** 72 saat geri dönüş süresi, bu sürede veriler silinmez
- **Bilgilendirme:** Danışana rıza geri çekmenin sonuçları (tedavi devamsızlığı, veri silme) açıkça gösterilir

---

## 28. WhatsApp Entegrasyonu (Evolution API)

### 28.1 Mimari Genel Bakış

ShifaHub, WhatsApp entegrasyonu için **Evolution API** (open-source, self-hosted) kullanır. Evolution API, Coolify üzerinde ayrı bir container olarak deploy edilir ve ana uygulama ile REST API + Webhook üzerinden haberleşir.

```
Danışan WhatsApp ←→ Evolution API ←→ ShifaHub Backend ←→ Database
                                   ←→ Knowledge Agent (RAG Chatbot)
```

### 28.2 Bağlantı Stratejisi

- **Birincil:** WhatsApp Business Cloud API (Meta onaylı, production için)
- **Yedek/Geliştirme:** Baileys (WhatsApp Web tabanlı, PoC ve düşük hacim)
- **Geçiş Planı:** Baileys ile başla, ölçeklendikçe Cloud API'ye migrasyon (Evolution API her ikisini destekler)

### 28.3 WhatsApp Özellikleri

#### Danışan Tarafı

- **Randevu Hatırlatma:** 24h ve 1h önce otomatik WhatsApp mesajı
- **Randevu Onay/İptal:** Interactive buttons ile "✅ Onayladım" / "❌ İptal Et" yanıtı
- **Randevu Alma:** WhatsApp üzerinden basit menü ile randevu talebi
- **AI Chatbot:** Danışan WhatsApp'tan GETAT soruları sorabilir (Knowledge Agent → RAG → yanıt)
- **Tedavi Özeti:** Tedavi sonrası kısa özet mesajı (eğitmen onayı ile)
- **Tahlil Hatırlatma:** "Tahlil sonuçlarınızı yüklemeyi unutmayın" bildirimi
- **Kontrol Randevusu:** Tedaviden 7 gün sonra hatırlatma + memnuniyet anketi

#### Eğitmen Tarafı

- **Günlük Ajanda:** Her sabah bugünün randevu listesi WhatsApp'tan
- **Yeni Danışan Bildirimi:** Yeni kayıt olduğunda bildirim
- **Hızlı Not:** WhatsApp'tan sesli mesaj göndererek tedavi notu ekleme (Whisper STT ile transkript)
- **Stok Uyarısı:** Malzeme azaldığında WhatsApp bildirimi

#### Admin Tarafı

- **Sistem Alertleri:** Downtime, hata oranı artışı, güvenlik ihlali
- **Komplikasyon Bildirimi:** Acil durum raporları anında WhatsApp'a
- **Günlük Özet:** Platform kullanım istatistikleri

### 28.4 WhatsApp Chatbot Akışı

```
1. Danışan "Merhaba" yazar
2. Evolution API webhook → ShifaHub Backend
3. Backend kullanıcıyı tanır (telefon numarası eşleşme)
4. Menü sunulur:
   📋 1. Randevularım
   📅 2. Yeni Randevu
   💊 3. Tedavi Bilgisi
   🤖 4. AI Asistan
   ❓ 5. Yardım
5. Seçime göre ilgili agent devreye girer
6. AI Asistan seçilirse → Knowledge Agent → RAG → kaynak referanslı yanıt
7. Yanıt Evolution API → WhatsApp → Danışan
```

### 28.5 WhatsApp Mesaj Şablonları

| Şablon | Tetikleyici | İçerik |
|--------|------------|--------|
| randevu_hatirlatma | Cron (24h/1h önce) | "Sayın {ad}, {tarih} tarihli {tedavi_turu} randevunuz hatırlatılır. ✅ Onay / ❌ İptal" |
| randevu_onay | Randevu oluşturulduğunda | "Randevunuz onaylandı: {tarih}, {saat}, {egitmen_ad}. Adres: {adres}" |
| tedavi_ozeti | Tedavi sonrası | "Tedaviniz tamamlandı. Özet: {tedavi_turu}, {notlar}. Kontrol: {kontrol_tarih}" |
| hosgeldiniz | İlk kayıt | "ShifaHub'a hoş geldiniz! Profilinizi tamamlamak için: {link}" |
| tahlil_hatirlatma | Tedaviden 3 gün sonra | "Tahlil sonuçlarınızı sisteme yüklemeyi unutmayın: {link}" |

### 28.6 Evolution API Coolify Deploy

```yaml
# docker-compose.yml (Coolify içinde)
evolution-api:
  image: atendai/evolution-api:latest
  environment:
    - AUTHENTICATION_API_KEY=${EVO_API_KEY}
    - DATABASE_CONNECTION_URI=postgresql://${DB_USER}:${DB_PASS}@postgres:5432/evolution
    - CACHE_REDIS_URI=redis://redis:6379/1
    - SERVER_URL=https://wa.shifahub.app
    - WEBHOOK_GLOBAL_URL=https://api.shifahub.app/webhooks/whatsapp
    - WEBHOOK_GLOBAL_ENABLED=true
  ports:
    - "8080:8080"
  depends_on:
    - postgres
    - redis
```

### 28.7 KVKK Uyumu — WhatsApp

- Danışandan WhatsApp iletişimi için ayrı açık rıza alınır
- Mesaj içeriklerinde hassas sağlık verisi bulunmaz (sadece genel bildirimler)
- Tedavi detayları yalnızca link ile uygulamaya yönlendirilir
- WhatsApp sohbet geçmişi ShifaHub tarafında loglanmaz (privacy-first)
- Opt-out: Danışan "DURDUR" yazarak bildirimlerden çıkabilir

---

## 29. Telegram Bot Entegrasyonu

### 29.1 Bot Mimarisi

ShifaHub Telegram botu, eğitmenler ve adminler için operasyonel destek kanalı olarak tasarlanmıştır. Danışan tarafı isteğe bağlıdır.

```
Telegram Bot API ←→ ShifaHub Backend (webhook) ←→ Agents
```

### 29.2 Telegram Bot Komutları

#### Eğitmen Komutları

| Komut | Açıklama |
|-------|----------|
| `/ajanda` | Bugünün randevu listesi |
| `/ajanda_yarin` | Yarının randevu listesi |
| `/danisan [isim]` | Danışan hızlı arama |
| `/stok` | Mevcut stok durumu özeti |
| `/not [danisan_id] [metin]` | Hızlı tedavi notu ekleme |
| `/acil [danisan_id]` | Acil durum raporu başlatma |
| `/istatistik` | Bu haftanın seans/danışan özeti |
| `/hatirlatma [saat] [mesaj]` | Kişisel hatırlatma kurma |

#### Admin Komutları

| Komut | Açıklama |
|-------|----------|
| `/durum` | Sistem sağlığı (uptime, CPU, disk, API latency) |
| `/kullanici_sayisi` | Toplam danışan/eğitmen sayıları |
| `/bugun` | Bugünkü platform aktivite özeti |
| `/komplikasyonlar` | Son 7 günün komplikasyon raporları |
| `/onay_bekleyen` | Onay bekleyen eğitmen başvuruları |
| `/broadcast [mesaj]` | Tüm eğitmenlere duyuru |
| `/kvkk_durum` | KVKK uyumluluk özet raporu |

#### Danışan Komutları (isteğe bağlı)

| Komut | Açıklama |
|-------|----------|
| `/randevularim` | Aktif randevular |
| `/soru [metin]` | AI asistana soru sorma |
| `/iptal [randevu_id]` | Randevu iptali |

### 29.3 Proaktif Telegram Bildirimleri

- **Sabah Ajanda:** Her gün 08:00'de eğitmene günün programı
- **Acil Durum:** Komplikasyon raporlarında admin grubuna anında alert
- **Sistem Alertleri:** Downtime, yüksek hata oranı, disk doluluk uyarısı
- **Stok Kritik:** Malzeme minimum seviyeye düştüğünde
- **Hacamat Sünnet Günleri:** Hicri 17/19/21 öncesi gece hatırlatma
- **Haftalık Özet:** Her Pazartesi platform haftalık istatistik raporu

### 29.4 Telegram Bot Teknik Detaylar

- **Framework:** grammY (TypeScript) veya node-telegram-bot-api
- **Webhook Mode:** Polling yerine webhook (daha verimli, Coolify arkasında)
- **Inline Keyboards:** Randevu onay/red, hızlı seçimler
- **Grup Desteği:** Admin grubu oluşturma, komplikasyon alertleri gruba gönderme
- **Rate Limiting:** Telegram API limitlerini aşmamak için queue sistemi
- **Bot Username:** @ShifaHubBot (veya alternatif)

---

## 30. Coolify Deploy Mimarisi

### 30.1 Coolify Neden?

- **Self-hosted PaaS:** Vercel/Netlify alternatifi, kendi sunucunda deploy
- **KVKK Uyumu:** Veriler yurt içi sunucuda kalır (Türkiye lokasyonlu VPS)
- **Docker-native:** Tüm servisler container olarak yönetilir
- **Git-push deploy:** GitHub webhook ile otomatik deploy
- **SSL otomatik:** Let's Encrypt ile ücretsiz SSL
- **Monitoring:** Dahili CPU/RAM/Disk takibi

### 30.2 Servis Topolojisi

```
┌─────────────────── Coolify Instance ───────────────────┐
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Next.js    │  │  API Server │  │ Evolution API│   │
│  │  (Frontend) │  │  (Backend)  │  │ (WhatsApp)   │   │
│  │  Port 3000  │  │  Port 4000  │  │ Port 8080    │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘   │
│         │                │                │            │
│  ┌──────┴────────────────┴────────────────┴───────┐   │
│  │              Coolify Reverse Proxy (Traefik)    │   │
│  │   app.shifahub.app → Next.js                    │   │
│  │   api.shifahub.app → API Server                 │   │
│  │   wa.shifahub.app  → Evolution API              │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │ PostgreSQL  │  │    Redis    │  │    MinIO      │   │
│  │  Port 5432  │  │  Port 6379  │  │  Port 9000    │   │
│  └─────────────┘  └─────────────┘  └──────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │   Qdrant    │  │   BullMQ    │                      │
│  │ (Vector DB) │  │  (Workers)  │                      │
│  │  Port 6333  │  │             │                      │
│  └─────────────┘  └─────────────┘                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Grafana + Prometheus                │   │
│  │              (Monitoring Stack)                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 30.3 Domain Yapısı

| Subdomain | Servis | Açıklama |
|-----------|--------|----------|
| app.shifahub.app | Next.js Frontend | Ana uygulama (PWA) |
| api.shifahub.app | Backend API | REST API + WebSocket |
| wa.shifahub.app | Evolution API | WhatsApp gateway |
| storage.shifahub.app | MinIO | Dosya depolama (internal) |
| monitor.shifahub.app | Grafana | Monitoring dashboard (admin only) |

### 30.4 Deployment Pipeline

```
1. Developer → git push feature branch
2. GitHub PR → CI (lint + test + build)
3. PR merge to develop → Coolify auto-deploy to staging
4. Manual approval → git tag v1.x.x
5. Tag push → Coolify deploy to production
6. Health check → rollback if fail
```

### 30.5 Backup Stratejisi

- **PostgreSQL:** pg_dump günlük, encrypted, offsite (S3 compatible)
- **MinIO:** Rsync ile secondary storage, 30 gün retention
- **Qdrant:** Snapshot API ile haftalık backup
- **Redis:** RDB + AOF persistence, günlük snapshot

---

## 31. Dinamik İçerik ve Bağlam Farkındalıklı AI

### 31.1 Context-Aware Suggestion Engine

Eğitmen not alırken veya ses kaydederken, sistem arka planda Named Entity Recognition (NER) çalıştırarak bağlamsal öneriler sunar.

### 31.2 Çalışma Akışı

```
Eğitmen yazı/ses girişi
    ↓
STT (Whisper) → Metin
    ↓
Clinical Agent → NER İşlemi
    ├── Hastalık tanıma: "bel fıtığı", "migren", "diyabet"
    ├── Bitki tanıma: "kırk kilit otu", "çörek otu", "zerdeçal"
    ├── Anatomik bölge: "L4-L5", "servikal", "lumbar"
    └── Tedavi yöntemi: "hacamat", "sülük", "refleksoloji"
    ↓
Knowledge Agent → Vector DB Sorgusu
    ↓
Sağ Panel Widget güncellenir:
    ├── 📚 İlgili külliyat bilgileri
    ├── 📍 Hacamat/sujok noktaları
    ├── ⚠️ Kontrendikasyon uyarıları
    ├── 📖 Hadis/kaynak referansları
    └── 📋 Önerilen protokol şablonları
```

### 31.3 Kontrendikasyon ve Çapraz Reaksiyon Motoru

Külliyattaki fitoterapi bilgileri ve danışanın anamnez verisi otomatik eşleştirilir:

| Senaryo | Tetikleyici | Uyarı |
|---------|------------|-------|
| Kan sulandırıcı + Sülük | Danışan warfarin kullanıyor, sülük tedavisi planlanıyor | ⚠️ YÜKSEK RİSK: Kanama riski. Sorumlu tabip onayı gerekli |
| Hamilelik + Hacamat | Danışan hamile, hacamat planlanıyor | ⚠️ Belirli bölgeler kontrendike. Güvenli noktalar listesi göster |
| Böbrek yetmezliği + Bitki | Kırk kilit otu önerisi, danışanın böbrek sorunu var | ⚠️ Doz ayarı gerekli. Nefroloji konsültasyonu öner |
| Alerji + Sülük | Danışanın sülük alerjisi kaydı var | 🚫 KESİN KONTRENDİKASYON: Sülük tedavisi uygulanamaz |

### 31.4 Anonimleştirilmiş Tedavi Başarı Analizi

Platform genelinde toplanan veriler anonimleştirilerek analiz edilir:

- **Şikayet-Tedavi Eşleşme Başarısı:** "Migren + Hacamat + Refleksoloji kombinasyonu: %82 iyileşme bildirimi"
- **Protokol Önerisi:** Benzer şikayetlerde en başarılı tedavi kombinasyonları eğitmene önerilir
- **Seans Sayısı Tahmini:** Benzer vakalardaki ortalama seans sayısı gösterilir
- **Mevsimsel Analiz:** Şikayetlerin mevsimsel dağılımı ve tedavi zamanlaması önerileri

### 31.5 GETAT Taksonomi Katmanı

Dinamik öneri sisteminin doğru çalışması için standart etiketleme:

- **ICD-10 Haritalaması:** GETAT şikayetleri → ICD-10 kodları (basitleştirilmiş)
- **Bitki Taksonomi:** WHO/EMA monograf numaraları ile etiketleme
- **Hacamat Noktaları:** Standardize edilmiş nokta kodlaması (anatomik referans)
- **Hadis İndeksleme:** Kitap-bab-numara formatında referans sistemi

---

## 32. Sözlük (Glossary)

| Terim | Açıklama |
|-------|----------|
| GETAT | Geleneksel ve Tamamlayıcı Tıp |
| Hacamat | Kupa terapi / wet cupping — kan aldırma tedavisi |
| Sülük Tedavisi | Hirudoterapi — tıbbi sülük ile tedavi |
| Sujok | El ve ayak üzerinden uygulanan Kore kökenli tedavi sistemi |
| Refleksoloji | Ayak, el ve kulak üzerindeki refleks noktalarına baskı uygulama |
| Anamnez | Hasta öyküsü — sağlık geçmişi bilgileri |
| KVKK | Kişisel Verilerin Korunması Kanunu (6698 sayılı) |
| RAG | Retrieval-Augmented Generation — bilgi tabanlı yapay zeka yanıt üretimi |
| STT | Speech-to-Text — sesten yazıya dönüşüm |
| NER | Named Entity Recognition — metin içinde varlık ismi tanıma |
| PWA | Progressive Web Application — mobil uygulama gibi çalışan web |
| Evolution API | Self-hosted WhatsApp entegrasyon gateway'i (açık kaynak) |
| Coolify | Self-hosted PaaS — deploy yönetim aracı |
| Danışan | Tedavi alan kişi (sistemdeki hasta karşılığı) |
| Eğitmen | GETAT sertifikalı uygulama uzmanı |
| Hicri Takvim | İslamî ay takvimi (Umm al-Qura hesaplaması) |
| Onam Formu | Aydınlatılmış onam — tedavi öncesi bilgilendirme ve rıza belgesi |
| Kontrendikasyon | Tedavinin uygulanmaması gereken durum |
| Komplikasyon | Tedavi sırasında/sonrasında oluşan istenmeyen durum |
| Baileys | WhatsApp Web protokolü üzerinden çalışan açık kaynak kütüphane |
| Cloud API | Meta'nın resmi WhatsApp Business API'si |

---

*Bu doküman ShifaHub projesi için hazırlanmış PRD belgesidir.*

*© 2026 — Tüm hakları saklıdır.*

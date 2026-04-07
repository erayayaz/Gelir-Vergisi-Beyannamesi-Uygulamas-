# GİB Bordro & Gelir Vergisi Beyannamesi Uygulaması (2025)

Bu web uygulaması, 2025 yılı bordro PDF dosyalarını otomatik olarak okuyup parse ederek, **GİB (Gelir İdaresi Başkanlığı) Hazır Beyan Sistemi'ne** uyumlu tablolar oluşturan tamamen istemci-taraflı (client-side) bir yardımcı araçtır.

## Özellikler

- **Masaüstü/Tarayıcı İçi Güvenlik:** PDF ayrıştırma işlemleri (parsing) tamamen tarayıcınızda gerçekleştirilir, hiçbir veri harici bir sunucuya veya buluta yüklenmez.
- **Çoklu Format Desteği:** Standart bordro formatlarını destekler. PDF formatı taranmış imaj ise OCR tabanlı kısıtlı okuma fall-back mekanizması çalışır.
- **2025 GVK Regülasyonları Uyumlu:**
  - GVK Madde 86 beyanname zorunluluğu hesabı (Eş zamanlı veya ardışık işveren)
  - GVK Madde 103 vergi dilimleri tablosu
  - GVK Madde 23/18 Asgari ücret istisnası
- **GİB Formatında Çıktı:** GİB Hazır Beyan Sistemindeki 3.B sekmesine birebir girilebilecek formatta tablo hazırlar.
- **Eksel Dışa Aktarım:** Oluşturulan tabloyu kontrol ve saklama amaçlı .xlsx olarak dışa aktarma seçeneği.

## Nasıl Kullanılır?

1. Uygulamaya gidin ve yükleme alanına .pdf uzantılı 2025 yılı bordrolarınızı bırakın.
2. Dosyalar uygulamanın akıllı ayrıştırma algoritması tarafından taranacak ve başarı/hata durumları listelenecektir.
3. "Verileri Doğrula" sekmesinden verilerin doğruluğunu, uyarıları veya eksik matrahları teyit edin. Eksiklik varsa elle düzeltme yapın.
4. "Sonuç" sayfasından **Tek İşveren (4.3 ML TL)** ve **İkinci İşveren (330 Bin TL)** beyan sınırlarına uyup uymadığınızı anında öğrenin.
5. GİB sayfasına kopyalanabilir ve eksiksiz formlar ile beyannamenizi hızlıca hazır edin!

## Geliştirme

Proje **React** ve **Vite** ile geliştirilmiştir, styling için global CSS (index.css) kullanılmıştır. Merkezi durum yönetimi **Zustand** ile yapılmış ve PDF işlemleri için `pdfjs-dist` kullanılmıştır.

### Local Kurulum

```sh
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Production sürümünü derleyin (dist/ klasörü içerisine)
npm run build
```

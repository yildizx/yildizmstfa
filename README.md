# 🔧 Oto Tamirci Yönetim Sistemi (MSTFA)

Türkçe web tabanlı oto tamirhaneleri için kapsamlı müşteri, araç ve servis yönetim sistemi.

## ✨ Özellikler

### 👥 Müşteri Yönetimi
- Müşteri bilgilerini kaydedin ve yönetin
- Otomatik QR kod oluşturma
- Müşteri portalı erişimi
- Müşteri geçmiş takibi

### 🚗 Araç Yönetimi
- Araç bilgilerini takip edin (marka, model, plaka, VIN)
- Araç servisi geçmişi
- Kilometre takibi
- Yakıt türü ve renk kaydı

### 🛠️ Servis Yönetimi
- Servis oluşturun ve takip edin
- Servis durumu (Beklemede, Devam Ediyor, Tamamlandı)
- İşçilik ve parça maliyetleri
- Servis fotoğrafları (Öncesi, Sırası, Sonrası)
- Servis raporları (PDF)
- Not ve açıklama alanları

### 💳 Ödeme Sistemi
- Ödeme takibi ve durumu
- Farklı ödeme yöntemleri (Nakit, Kredi Kartı, Çek, Transfer)
- Ödeme hatırlatmaları
- Toplam tutar hesaplaması

### 📧 Bildirim Sistemi
- **Email** bildirimleri
- **SMS** bildirimleri
- **WhatsApp** bildirimleri
- Servis başlama/tamamlama bildirimleri
- Ödeme hatırlatmaları
- Özelleştirilebilir bildirim ayarları

### 📱 Müşteri Portalı
- QR kod ile erişim
- Servis takibi
- Ödeme durumu görüntüleme
- Araç bilgilerini görüntüleme
- Rapor indirme

### 📊 Admin Paneli
- Gösterge paneli (Dashboard)
- İstatistikler
- Müşteri listesi
- Servis listesi
- Ödeme takibi
- Sistem ayarları

### 🔒 Güvenlik
- JWT token tabanlı authentication
- Şifre şifreleme (bcrypt)
- CORS koruması
- Helmet güvenlik headers
- Input validasyonu

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js (v14+)
- PostgreSQL (v12+)
- npm veya yarn

### Kurulum Adımları

#### 1. Repository'yi klonlayın
```bash
git clone https://github.com/yildizx/yildizmstfa.git
cd yildizmstfa
```

#### 2. Bağımlılıkları yükleyin
```bash
npm install
```

#### 3. Veritabanını oluşturun
```bash
# PostgreSQL'de yeni database oluşturun
createdb auto_repair_db

# Schema'yı çalıştırın
psql -U postgres -d auto_repair_db -f database/schema.sql

# Seed verilerini çalıştırın
psql -U postgres -d auto_repair_db -f database/seed.sql
```

#### 4. Ortam değişkenlerini ayarlayın
```bash
# .env dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin ve aşağıdaki değerleri girin:
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auto_repair_db
NODE_ENV=development
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### 5. Sunucuyu başlatın
```bash
# Development
npm run dev

# Production
npm start
```

Sunucu `http://localhost:3000` adresinde çalışacaktır.

## 📖 Kullanım

### Admin Girişi
1. `http://localhost:3000` adresine gidin
2. Demo kimlik bilgileri:
   - **Email:** admin@autoreparistem.com
   - **Şifre:** admin123

### Müşteri Portalı
- QR kod tarayın veya `http://localhost:3000/customer/{customerId}` adresine gidin
- Müşteri kendisinin servislerini takip edebilir

### API Endpoints

#### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/verify
```

#### Müşteriler
```bash
GET /api/customers
GET /api/customers/:id
POST /api/customers
PUT /api/customers/:id
DELETE /api/customers/:id
GET /api/customers/:id/qr
```

#### Araçlar
```bash
GET /api/vehicles/customer/:customerId
GET /api/vehicles/:id
POST /api/vehicles
PUT /api/vehicles/:id
DELETE /api/vehicles/:id
```

#### Servisler
```bash
GET /api/services
GET /api/services/:id
POST /api/services
PUT /api/services/:id
POST /api/services/:id/photos
GET /api/services/:id/photos
DELETE /api/services/:id/photos/:photoId
```

#### Ödemeler
```bash
GET /api/payments
GET /api/payments/customer/:customerId
POST /api/payments
PUT /api/payments/:id
```

## 📁 Proje Yapısı

```
yildizmstfa/
├── backend/
│   ├── routes/
│   │   ├── auth.js           # Kimlik doğrulama rotaları
│   │   ├── customers.js      # Müşteri yönetimi
│   │   ├── vehicles.js       # Araç yönetimi
│   │   ├── services.js       # Servis yönetimi
│   │   ├── payments.js       # Ödeme yönetimi
│   │   └── reports.js        # Raporlar
│   ├── services/
│   │   └── notificationService.js  # Bildirim servisi
│   ├── config.js             # Veritabanı konfigurasyonu
│   └── server.js             # Ana sunucu dosyası
├── frontend/
│   ├── index.html            # Giriş sayfası
│   ├── admin-panel.html      # Admin paneli
│   └── customer-portal.html  # Müşteri portalı
├── database/
│   ├── schema.sql            # Veritabanı şeması
│   └── seed.sql              # Test veriler
├── uploads/                  # Yüklenen dosyalar
├── package.json              # Bağımlılıklar
├── .env.example              # Ortam değişkenleri şablonu
├── .gitignore                # Git ignore dosyası
└── README.md                 # Bu dosya
```

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Veritabanı
- **JWT** - Token authentication
- **bcryptjs** - Şifre şifreleme
- **nodemailer** - Email gönderimi
- **multer** - Dosya yüklemesi
- **qrcode** - QR kod oluşturma
- **pdfkit** - PDF oluşturma

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling
- **JavaScript (Vanilla)** - Interaktivite
- **Responsive Design** - Mobile uyumlu

## 📧 Email Konfigurasyonu

### Gmail Kullanarak

1. Gmail hesabınızda 2 Adımlı Doğrulama'yı etkinleştirin
2. "App Passwords" bölümünden bir uygulama şifresi oluşturun
3. `.env` dosyasına ekleyin:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Diğer Email Servisleri
```env
# SendGrid
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key

# Mailgun
EMAIL_SERVICE=mailgun
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASSWORD=your_mailgun_api_key
```

## 🔔 Bildirim Sistemi

### Email Bildirimleri
Otomatik olarak gönderilen e-postalar:
- Servis başladı
- Servis tamamlandı
- Ödeme hatırlatması

### SMS Bildirimleri
(Twilio API entegrasyonu gerekli)

### WhatsApp Bildirimleri
(Twilio WhatsApp API entegrasyonu gerekli)

## 📄 Raporlar

Servis raporları PDF formatında oluşturulur ve şunları içerir:
- Müşteri bilgileri
- Araç bilgileri
- Servis detayları
- Maliyet analizi
- Servis fotoğrafları
- Tavsiyeler

## 🔐 Güvenlik Notları

- `.env` dosyasını asla versiyon kontrolüne eklemeyin
- Üretim ortamında `JWT_SECRET`'i güçlü bir şifre ile değiştirin
- Veritabanı şifresini güçlü tutun
- HTTP yerine HTTPS kullanın
- CORS ayarlarını üretim için sınırlandırın
- Input validasyonları daima serverda yapın

## 🐛 Sorun Giderme

### Veritabanı Bağlantısı Başarısız
```bash
# PostgreSQL'in çalıştığını kontrol edin
sudo service postgresql status

# Kimlik bilgilerini kontrol edin
psql -U postgres -d auto_repair_db
```

### Port 3000 Zaten Kullanımda
```bash
# Farklı bir port kullanın
PORT=3001 npm start

# Veya kullanılan procesi bulun ve öldürün
lsof -i :3000
kill -9 <PID>
```

### Email Gönderimi Başarısız
- Gmail iki aşamalı doğrulamayı etkinleştirdiniz mi?
- App password'u doğru girdiniz mi?
- Firewall SMTP portunu engelliyor mu?

## 📞 İletişim & Destek

- **Email:** info@autoreparistem.com
- **Telefon:** +90 (555) 123-4567
- **GitHub Issues:** [Sorun Bildir](https://github.com/yildizx/yildizmstfa/issues)

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Katkıda Bulunun

Katkılarınız hoşgeldiniz! Lütfen:

1. Fork yapın
2. Feature branch'i oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 🗺️ Yol Haritası

- [ ] SMS bildirim entegrasyonu (Twilio)
- [ ] WhatsApp bildirim entegrasyonu
- [ ] Gelir/Gider raporları
- [ ] İstatistik dashboard'u
- [ ] Mobil uygulama (React Native)
- [ ] Otomatik backup sistemi
- [ ] Multi-user access control
- [ ] Multilingual support (EN, DE, FR)

## 👨‍💻 Geliştirici

**yildizx**
- GitHub: [@yildizx](https://github.com/yildizx)
- 🇹🇷 Türkiye

## 📊 Proje İstatistikleri

- **Başlangıç Tarihi:** Ağustos 2022
- **Güncelleme:** Haziran 2024
- **Sürüm:** 1.0.0
- **Durum:** Aktif Geliştirme 🚀

---

**Not:** Bu sistem Türk oto tamirhaneleri için özel olarak tasarlanmıştır. Türkçe arayüz ve Türk vergi sistemi uyumluluğu içerir.

Soruların mı var? GitHub Issues'de soru açabilirsiniz! 🎯

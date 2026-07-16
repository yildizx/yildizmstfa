# Oto Tamirci Yönetim Sistemi - Kurulum Rehberi

## 📋 Hızlı Başlangıç Adımları

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. PostgreSQL Veritabanı Oluştur
```bash
# PostgreSQL açık olmalı
creatdb auto_repair_db

# Schema'yı çalıştır
psql -U postgres -d auto_repair_db -f database/schema.sql

# Test verilerini yükle (opsiyonel)
psql -U postgres -d auto_repair_db -f database/seed.sql
```

### 3. Ortam Değişkenlerini Ayarla
```bash
# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle
nano .env
```

**Gerekli değişkenler:**
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auto_repair_db
PORT=3000
JWT_SECRET=your_secret_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Sunucuyu Başlat
```bash
# Development
npm run dev

# Production
npm start
```

### 5. Tarayıcıda Aç
- **Ana sayfa:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin-panel.html
- **Müşteri Portalı:** http://localhost:3000/customer-portal.html?id=1

## 🔐 Demo Kimlik Bilgileri

**Email:** admin@autoreparistem.com  
**Şifre:** admin123

## 📧 Email Ayarı (Gmail)

1. Gmail hesabınızda 2-step verification'ı etkinleştirin
2. "App Passwords" bölümüne gidin
3. Yeni bir uygulama şifresi oluşturun
4. `.env` dosyasına ekleyin:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=generated_app_password
```

## 🧪 Test API Endpoints

### Giriş Yap
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autoreparistem.com","password":"admin123"}'
```

### Müşterileri Listele
```bash
curl http://localhost:3000/api/customers
```

### Yeni Müşteri Ekle
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Müşteri",
    "phone":"+90 555 123 4567",
    "email":"test@example.com",
    "address":"Test Adres"
  }'
```

## 📁 Proje Dosya Yapısı

```
yildizmstfa/
├── backend/
│   ├── routes/
│   │   ├── auth.js          ✅ Kimlik doğrulama
│   │   ├── customers.js     ✅ Müşteri yönetimi
│   │   ├── vehicles.js      ✅ Araç yönetimi
│   │   ├── services.js      ✅ Servis yönetimi
│   │   ├── payments.js      ✅ Ödeme yönetimi
│   │   └── reports.js       ✅ Raporlar
│   ├── services/
│   │   └── notificationService.js  ✅ Bildirimler
│   ├── config.js            ✅ DB Konfigürasyonu
│   └── server.js            ✅ Ana sunucu
├── frontend/
│   ├── index.html           ✅ Giriş sayfası
│   ├── admin-panel.html     ✅ Admin paneli
│   └── customer-portal.html ✅ Müşteri portalı
├── database/
│   ├── schema.sql           ✅ Veritabanı şeması
│   └── seed.sql             ✅ Test veriler
├── .env.example             ✅ Ortam şablonu
├── .gitignore               ✅ Git ignore
├── package.json             ✅ Bağımlılıklar
└── README.md                ✅ Dokümantasyon
```

## 🔧 Sorun Giderme

### Veritabanı Bağlantısı Başarısız
```bash
# PostgreSQL status kontrol et
sudo service postgresql status

# Veritabanını test et
psql -U postgres -d auto_repair_db -c "SELECT 1;"
```

### Port Zaten Kullanımda
```bash
# Farklı port kullan
PORT=3001 npm run dev

# Veya işlemi öldür
lsof -i :3000
kill -9 <PID>
```

### Email Gönderimi Başarısız
- Gmail 2FA'yı kontrol edin
- App password doğru olmalı
- Firewall SMTP portunu engelliyor olabilir (port 587)

## 📝 Sonraki Adımlar

- [ ] SMS bildirim entegrasyonu (Twilio)
- [ ] WhatsApp bildirim entegrasyonu
- [ ] Mobil uygulama (React Native)
- [ ] Gelir/Gider raporları
- [ ] İstatistik dashboard
- [ ] Otomatik backup sistemi

## 🤝 İletişim

Soruları için:
- 📧 GitHub Issues: https://github.com/yildizx/yildizmstfa/issues
- 📞 Email: info@autoreparistem.com

---

✅ **Sistem başarıyla kuruldu ve çalışmaya hazır!**

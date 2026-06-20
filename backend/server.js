// Ana Sunucu Dosyası
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Uploads klasörü oluştur
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==================== Middleware ====================
app.use(helmet()); // Güvenlik headers
app.use(cors()); // Cross-Origin istekleri etkinleştir
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static dosyalar
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '../frontend')));

// ==================== API Routes ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/services', require('./routes/services'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reports', require('./routes/reports'));

// ==================== Ana Sayfalar ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-panel.html'));
});

app.get('/customer/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/customer-portal.html'));
});

// ==================== Hata Yönetimi ====================
app.use((err, req, res, next) => {
    console.error('Hata:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ==================== Sunucuyu Başlat ====================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🔧 Oto Tamirci Yönetim Sistemi         ║
║   ${new Date().toLocaleTimeString('tr-TR')}               
║   Server başlatıldı → http://localhost:${PORT}    ║
╚════════════════════════════════════════════╝
    `);
});

module.exports = app;

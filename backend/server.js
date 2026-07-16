-- ==================== SERVER CONFIGURATION ====================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const pool = require('./config');

// Ortam değişkenlerini yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files
app.use(express.static('frontend'));
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Customer routes
app.use('/api/customers', require('./routes/customers'));

// Vehicle routes
app.use('/api/vehicles', require('./routes/vehicles'));

// Service routes
app.use('/api/services', require('./routes/services'));

// Payment routes
app.use('/api/payments', require('./routes/payments'));

// Reports routes
app.use('/api/reports', require('./routes/reports'));

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '✅ Sistem çalışıyor',
        timestamp: new Date().toISOString()
    });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '❌ Sayfa bulunamadı'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`
🚀 Oto Tamirci Yönetim Sistemi başlatılıyor...
`);
    console.log(`📌 Sunucu: http://localhost:${PORT}`);
    console.log(`📌 Admin Panel: http://localhost:${PORT}/admin-panel.html`);
    console.log(`📌 Müşteri Portalı: http://localhost:${PORT}/customer-portal.html`);
    console.log(`📌 API Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;

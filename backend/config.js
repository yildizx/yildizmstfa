// Veritabanı Konfigürasyonu
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'auto_repair_db'
});

pool.on('error', (err) => {
    console.error('Veritabanı bağlantı hatası:', err);
});

// Bağlantı testi
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Veritabanı bağlantısı başarısız:', err.message);
    } else {
        console.log('✅ Veritabanı bağlantısı başarılı');
    }
});

module.exports = pool;

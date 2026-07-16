-- ==================== DATABASE CONNECTION ====================
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'auto_repair_db'
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('✅ Veritabanına bağlandı');
});

pool.on('disconnect', () => {
    console.log('❌ Veritabanından bağlantı kesildi');
});

module.exports = pool;

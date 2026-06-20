// Kimlik Doğrulama Rotası
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config');

// Giriş Yap
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email ve şifre gerekli'
            });
        }

        // Kullanıcıyı bul
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre yanlış'
            });
        }

        const user = result.rows[0];

        // Şifre kontrolü
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre yanlış'
            });
        }

        // JWT Token oluştur
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key_change_in_production',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Kayıt Ol (Admin tarafından)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Tüm alanlar gerekli'
            });
        }

        // Email zaten var mı kontrol et
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu email zaten kayıtlı'
            });
        }

        // Şifreyi hash'le
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcı oluştur
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
            [email, hashedPassword, name, role || 'staff']
        );

        res.status(201).json({
            success: true,
            message: 'Kullanıcı başarıyla oluşturuldu',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Token Doğrula
router.post('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_in_production');
        res.json({ success: true, user: decoded });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Geçersiz token',
            error: error.message
        });
    }
});

module.exports = router;

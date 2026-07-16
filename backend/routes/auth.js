// Kimlik Doğrulama Rotası
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config');
const { body, validationResult } = require('express-validator');

// ==================== MIDDLEWARE ====================

// Token doğrula
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token bulunamadı'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Geçersiz token',
            error: error.message
        });
    }
};

// ==================== ROUTES ====================

// Giriş yap
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        // Validasyon hatalarını kontrol et
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validasyon hatası',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Kullanıcıyı bul
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre hatalı'
            });
        }

        const user = result.rows[0];

        // Şifreyi kontrol et
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre hatalı'
            });
        }

        // Token oluştur
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            message: '✅ Giriş başarılı',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Giriş hatası',
            error: error.message
        });
    }
});

// Kayıt ol
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
], async (req, res) => {
    try {
        // Validasyon hatalarını kontrol et
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validasyon hatası',
                errors: errors.array()
            });
        }

        const { email, password, name } = req.body;

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

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcıyı oluştur
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, role)
             VALUES ($1, $2, $3, 'staff')
             RETURNING id, email, name, role`,
            [email, hashedPassword, name]
        );

        const user = result.rows[0];

        // Token oluştur
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            message: '✅ Kayıt başarılı',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Kayıt hatası',
            error: error.message
        });
    }
});

// Token doğrula
router.post('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: '✅ Token geçerli',
        user: req.user
    });
});

// Profil bilgilerini getir
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Profil getirilemedi',
            error: error.message
        });
    }
});

// Profil güncelle
router.put('/profile', verifyToken, [
    body('name').optional().notEmpty(),
    body('email').optional().isEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validasyon hatası',
                errors: errors.array()
            });
        }

        const { name, email } = req.body;

        const result = await pool.query(
            `UPDATE users
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email)
             WHERE id = $3
             RETURNING id, email, name, role`,
            [name, email, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            message: '✅ Profil güncellendi',
            user: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Profil güncellenemedi',
            error: error.message
        });
    }
});

// Şifre değiştir
router.post('/change-password', verifyToken, [
    body('oldPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validasyon hatası',
                errors: errors.array()
            });
        }

        const { oldPassword, newPassword } = req.body;

        // Kullanıcıyı getir
        const userResult = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Eski şifreyi kontrol et
        const validPassword = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Eski şifre hatalı'
            });
        }

        // Yeni şifreyi hashle
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Şifreyi güncelle
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, req.user.id]
        );

        res.json({
            success: true,
            message: '✅ Şifre başarıyla değiştirildi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Şifre değiştirilemedi',
            error: error.message
        });
    }
});

// Tüm kullanıcıları getir (admin için)
router.get('/', verifyToken, async (req, res) => {
    try {
        // Admin kontrolü
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Yetkiniz yok'
            });
        }

        const result = await pool.query(
            'SELECT id, email, name, role, is_active, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Kullanıcılar getirilemedi',
            error: error.message
        });
    }
});

module.exports = { router, verifyToken };

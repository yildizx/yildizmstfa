// Müşteri Yönetimi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');

// Tüm müşterileri getir
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM customers WHERE is_active = true ORDER BY name ASC'
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Müşteriler alınamadı',
            error: error.message
        });
    }
});

// Müşteri detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;

        // Müşteri bilgilerini getir
        const customerResult = await pool.query(
            'SELECT * FROM customers WHERE id = $1',
            [customerId]
        );

        if (customerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Müşteri bulunamadı'
            });
        }

        const customer = customerResult.rows[0];

        // Araçları getir
        const vehiclesResult = await pool.query(
            'SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC',
            [customerId]
        );

        // Servisleri getir
        const servicesResult = await pool.query(
            `SELECT s.* FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             WHERE v.customer_id = $1
             ORDER BY s.created_at DESC`,
            [customerId]
        );

        res.json({
            success: true,
            data: {
                customer,
                vehicles: vehiclesResult.rows,
                services: servicesResult.rows
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Müşteri alınamadı',
            error: error.message
        });
    }
});

// Yeni müşteri oluştur
router.post('/', [
    body('name').notEmpty(),
    body('phone').notEmpty(),
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

        const { name, phone, email, address } = req.body;

        // QR kod ID oluştur
        const qrCodeId = 'CUST-' + Date.now();

        const result = await pool.query(
            `INSERT INTO customers (name, phone, email, address, qr_code_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, phone, email || null, address || null, qrCodeId]
        );

        const customer = result.rows[0];

        // QR kod oluştur
        try {
            const qrCodeData = await QRCode.toDataURL(`http://localhost:3000/customer-portal.html?id=${customer.id}`);
            await pool.query(
                'UPDATE customers SET qr_code_data = $1 WHERE id = $2',
                [qrCodeData, customer.id]
            );
        } catch (qrError) {
            console.error('QR kod oluşturma hatası:', qrError);
        }

        // Bildirim ayarlarını oluştur
        await pool.query(
            `INSERT INTO notification_settings (customer_id, send_email, send_sms, send_whatsapp)
             VALUES ($1, true, false, false)`,
            [customer.id]
        );

        res.status(201).json({
            success: true,
            message: '✅ Müşteri başarıyla oluşturuldu',
            data: customer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Müşteri oluşturulamadı',
            error: error.message
        });
    }
});

// Müşteri güncelle
router.put('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const { name, phone, email, address } = req.body;

        const result = await pool.query(
            `UPDATE customers
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 email = COALESCE($3, email),
                 address = COALESCE($4, address),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [name, phone, email, address, customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Müşteri bulunamadı'
            });
        }

        res.json({
            success: true,
            message: '✅ Müşteri güncellendi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Müşteri güncellenemedi',
            error: error.message
        });
    }
});

// Müşteri sil
router.delete('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;

        const result = await pool.query(
            'UPDATE customers SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
            [customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Müşteri bulunamadı'
            });
        }

        res.json({
            success: true,
            message: '✅ Müşteri silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Müşteri silinemedi',
            error: error.message
        });
    }
});

// QR kod indir
router.get('/:id/qr', async (req, res) => {
    try {
        const customerId = req.params.id;

        const result = await pool.query(
            'SELECT qr_code_data FROM customers WHERE id = $1',
            [customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Müşteri bulunamadı'
            });
        }

        if (!result.rows[0].qr_code_data) {
            return res.status(400).json({
                success: false,
                message: 'QR kod bulunamadı'
            });
        }

        res.json({
            success: true,
            qrCode: result.rows[0].qr_code_data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'QR kod alınamadı',
            error: error.message
        });
    }
});

// İstatistikler
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_customers,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
                COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_customers
             FROM customers`
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'İstatistikler alınamadı',
            error: error.message
        });
    }
});

module.exports = router;

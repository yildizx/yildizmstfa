// Müşteri Yönetimi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Tüm müşterileri getir
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM customers WHERE is_active = true ORDER BY created_at DESC'
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

// Müşteri detaylarını getir (ID ile)
router.get('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;

        // Müşteri bilgisi
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

        // Araçlar
        const vehiclesResult = await pool.query(
            'SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC',
            [customerId]
        );

        // Servisler
        const servicesResult = await pool.query(
            `SELECT s.*, v.brand, v.model, v.license_plate 
             FROM services s
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
            message: 'Müşteri detayları alınamadı',
            error: error.message
        });
    }
});

// Yeni müşteri oluştur
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'İsim ve telefon gerekli'
            });
        }

        // QR Kod ID oluştur
        const qrCodeId = uuidv4().substring(0, 8).toUpperCase();
        const qrCodeUrl = `${process.env.APP_URL || 'http://localhost:3000'}/customer/${qrCodeId}`;

        // QR Kod oluştur
        const qrCodeData = await QRCode.toDataURL(qrCodeUrl);

        // Müşteri oluştur
        const result = await pool.query(
            `INSERT INTO customers (name, phone, email, address, qr_code_id, qr_code_data) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [name, phone, email || null, address || null, qrCodeId, qrCodeData]
        );

        res.status(201).json({
            success: true,
            message: 'Müşteri başarıyla oluşturuldu',
            data: result.rows[0]
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
                 address = COALESCE($4, address)
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
            message: 'Müşteri güncellendi',
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

// Müşteri sil (aktif durumunu değiştir)
router.delete('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;

        const result = await pool.query(
            'UPDATE customers SET is_active = false WHERE id = $1 RETURNING id',
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
            message: 'Müşteri silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Müşteri silinemedi',
            error: error.message
        });
    }
});

// QR Kod getir
router.get('/:id/qr', async (req, res) => {
    try {
        const customerId = req.params.id;

        const result = await pool.query(
            'SELECT qr_code_data, qr_code_id FROM customers WHERE id = $1',
            [customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'QR kod bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'QR kod alınamadı',
            error: error.message
        });
    }
});

module.exports = router;

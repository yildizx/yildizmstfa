// Ödeme Yönetimi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const { notifyPaymentReminder } = require('../services/notificationService');

// Tüm ödemeleri getir
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, c.name as customer_name
             FROM payments p
             JOIN customers c ON p.customer_id = c.id
             ORDER BY p.created_at DESC`
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ödemeler alınamadı',
            error: error.message
        });
    }
});

// Müşterinin ödemelerini getir
router.get('/customer/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;

        const result = await pool.query(
            `SELECT p.*, s.service_description
             FROM payments p
             LEFT JOIN services s ON p.service_id = s.id
             WHERE p.customer_id = $1
             ORDER BY p.created_at DESC`,
            [customerId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ödemeler alınamadı',
            error: error.message
        });
    }
});

// Ödeme detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;

        const result = await pool.query(
            `SELECT p.*, c.name as customer_name, c.phone, c.email, s.service_description
             FROM payments p
             JOIN customers c ON p.customer_id = c.id
             LEFT JOIN services s ON p.service_id = s.id
             WHERE p.id = $1`,
            [paymentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ödeme bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ödeme alınamadı',
            error: error.message
        });
    }
});

// Yeni ödeme oluştur
router.post('/', async (req, res) => {
    try {
        const { 
            service_id,
            customer_id, 
            amount, 
            payment_method,
            notes
        } = req.body;

        if (!customer_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Müşteri ve tutar gerekli'
            });
        }

        const result = await pool.query(
            `INSERT INTO payments (
                service_id, customer_id, amount, payment_method, 
                status, notes, receipt_number
            ) VALUES ($1, $2, $3, $4, $5, $6, 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'))
            RETURNING *`,
            [
                service_id || null,
                customer_id,
                amount,
                payment_method || 'Belirtilmemiş',
                'Beklemede',
                notes || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Ödeme kaydı oluşturuldu',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ödeme oluşturulamadı',
            error: error.message
        });
    }
});

// Ödemeyi güncelle (Ödendi olarak işaretle)
router.put('/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;
        const { status, payment_date, payment_method } = req.body;

        const result = await pool.query(
            `UPDATE payments
             SET status = COALESCE($1, status),
                 payment_date = COALESCE($2, payment_date),
                 payment_method = COALESCE($3, payment_method)
             WHERE id = $4
             RETURNING *`,
            [status, payment_date, payment_method, paymentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ödeme bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Ödeme güncellendi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ödeme güncellenemedi',
            error: error.message
        });
    }
});

// Ödeme sil
router.delete('/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;

        const result = await pool.query(
            'DELETE FROM payments WHERE id = $1 RETURNING id',
            [paymentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ödeme bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Ödeme silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ödeme silinemedi',
            error: error.message
        });
    }
});

// Ödeme hatırlatması gönder
router.post('/:id/reminder', async (req, res) => {
    try {
        const paymentId = req.params.id;

        const paymentResult = await pool.query(
            'SELECT * FROM payments WHERE id = $1',
            [paymentId]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ödeme bulunamadı'
            });
        }

        const payment = paymentResult.rows[0];

        // Hatırlatma gönder
        await notifyPaymentReminder(
            payment.customer_id,
            payment.service_id,
            payment.amount
        );

        res.json({
            success: true,
            message: 'Ödeme hatırlatması gönderildi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Hatırlatma gönderilemedi',
            error: error.message
        });
    }
});

// İstatistikler
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'Ödendi' THEN amount ELSE 0 END) as paid_amount,
                SUM(CASE WHEN status = 'Beklemede' THEN amount ELSE 0 END) as pending_amount,
                AVG(amount) as average_amount
             FROM payments`
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
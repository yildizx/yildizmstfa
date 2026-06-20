// Ödeme Takibi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');

// Tüm ödemeleri getir
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, c.name as customer_name, c.phone, s.service_description
             FROM payments p
             JOIN customers c ON p.customer_id = c.id
             JOIN services s ON p.service_id = s.id
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

// Müşteri ödemelerini getir
router.get('/customer/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;

        const result = await pool.query(
            `SELECT p.*, s.service_description, v.brand, v.model
             FROM payments p
             JOIN services s ON p.service_id = s.id
             JOIN vehicles v ON s.vehicle_id = v.id
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

// Ödeme oluştur
router.post('/', async (req, res) => {
    try {
        const { service_id, customer_id, amount, payment_method, status, notes } = req.body;

        if (!service_id || !customer_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Gerekli alanlar eksik'
            });
        }

        const result = await pool.query(
            `INSERT INTO payments (service_id, customer_id, amount, payment_method, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [service_id, customer_id, amount, payment_method || 'Nakit', status || 'Beklemede', notes]
        );

        res.status(201).json({
            success: true,
            message: 'Ödeme kaydı oluşturuldu',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ödeme kaydı oluşturulamadı',
            error: error.message
        });
    }
});

// Ödeme güncelle
router.put('/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;
        const { amount, payment_method, status, payment_date, notes } = req.body;

        const result = await pool.query(
            `UPDATE payments
             SET amount = COALESCE($1, amount),
                 payment_method = COALESCE($2, payment_method),
                 status = COALESCE($3, status),
                 payment_date = COALESCE($4, payment_date),
                 notes = COALESCE($5, notes)
             WHERE id = $6
             RETURNING *`,
            [amount, payment_method, status, payment_date, notes, paymentId]
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

// Ödeme istatistikleri
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
             FROM payments
             GROUP BY status`
        );

        res.json({
            success: true,
            data: result.rows
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

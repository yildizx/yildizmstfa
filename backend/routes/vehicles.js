// Araç Yönetimi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const { body, validationResult } = require('express-validator');

// Tüm araçları getir
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT v.*, c.name as customer_name
             FROM vehicles v
             JOIN customers c ON v.customer_id = c.id
             ORDER BY v.created_at DESC`
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araçlar alınamadı',
            error: error.message
        });
    }
});

// Araç detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const vehicleId = req.params.id;

        const result = await pool.query(
            `SELECT v.*, c.name as customer_name, c.phone, c.email
             FROM vehicles v
             JOIN customers c ON v.customer_id = c.id
             WHERE v.id = $1`,
            [vehicleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Araç bulunamadı'
            });
        }

        // Araç için servisleri getir
        const servicesResult = await pool.query(
            'SELECT * FROM services WHERE vehicle_id = $1 ORDER BY created_at DESC',
            [vehicleId]
        );

        res.json({
            success: true,
            data: {
                vehicle: result.rows[0],
                services: servicesResult.rows
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araç alınamadı',
            error: error.message
        });
    }
});

// Müşterinin araçlarını getir
router.get('/customer/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;

        const result = await pool.query(
            'SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC',
            [customerId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araçlar alınamadı',
            error: error.message
        });
    }
});

// Yeni araç oluştur
router.post('/', [
    body('customer_id').isInt(),
    body('brand').notEmpty(),
    body('model').notEmpty(),
    body('license_plate').notEmpty()
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

        const { 
            customer_id, 
            brand, 
            model, 
            year,
            license_plate,
            vin,
            color,
            fuel_type,
            mileage
        } = req.body;

        // Plaka zaten var mı kontrol et
        const existingPlate = await pool.query(
            'SELECT id FROM vehicles WHERE license_plate = $1',
            [license_plate]
        );

        if (existingPlate.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu plaka zaten kayıtlı'
            });
        }

        const result = await pool.query(
            `INSERT INTO vehicles (
                customer_id, brand, model, year, license_plate, 
                vin, color, fuel_type, mileage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                customer_id,
                brand,
                model,
                year || null,
                license_plate,
                vin || null,
                color || null,
                fuel_type || null,
                mileage || 0
            ]
        );

        res.status(201).json({
            success: true,
            message: '✅ Araç başarıyla oluşturuldu',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araç oluşturulamadı',
            error: error.message
        });
    }
});

// Araç güncelle
router.put('/:id', async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const { 
            brand, 
            model, 
            year,
            license_plate,
            color,
            fuel_type,
            mileage
        } = req.body;

        const result = await pool.query(
            `UPDATE vehicles
             SET brand = COALESCE($1, brand),
                 model = COALESCE($2, model),
                 year = COALESCE($3, year),
                 license_plate = COALESCE($4, license_plate),
                 color = COALESCE($5, color),
                 fuel_type = COALESCE($6, fuel_type),
                 mileage = COALESCE($7, mileage),
                 updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [brand, model, year, license_plate, color, fuel_type, mileage, vehicleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Araç bulunamadı'
            });
        }

        res.json({
            success: true,
            message: '✅ Araç güncellendi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araç güncellenemedi',
            error: error.message
        });
    }
});

// Araç sil
router.delete('/:id', async (req, res) => {
    try {
        const vehicleId = req.params.id;

        const result = await pool.query(
            'DELETE FROM vehicles WHERE id = $1 RETURNING id',
            [vehicleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Araç bulunamadı'
            });
        }

        res.json({
            success: true,
            message: '✅ Araç silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araç silinemedi',
            error: error.message
        });
    }
});

// İstatistikler
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_vehicles,
                COUNT(DISTINCT customer_id) as customers_with_vehicles,
                AVG(mileage) as average_mileage,
                MAX(mileage) as max_mileage
             FROM vehicles`
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

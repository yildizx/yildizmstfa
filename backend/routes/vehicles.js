// Araç Yönetimi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');

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

// Araç detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const vehicleId = req.params.id;

        const result = await pool.query(
            'SELECT * FROM vehicles WHERE id = $1',
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
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araç alınamadı',
            error: error.message
        });
    }
});

// Yeni araç ekle
router.post('/', async (req, res) => {
    try {
        const { customer_id, brand, model, year, license_plate, vin, color, fuel_type, mileage } = req.body;

        if (!customer_id || !brand || !model || !license_plate) {
            return res.status(400).json({
                success: false,
                message: 'Gerekli alanlar eksik'
            });
        }

        // License plate zaten var mı kontrol et
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
            `INSERT INTO vehicles (customer_id, brand, model, year, license_plate, vin, color, fuel_type, mileage)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [customer_id, brand, model, year, license_plate, vin, color, fuel_type, mileage || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Araç başarıyla eklendi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araç eklenemedi',
            error: error.message
        });
    }
});

// Araç güncelle
router.put('/:id', async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const { brand, model, year, license_plate, vin, color, fuel_type, mileage } = req.body;

        const result = await pool.query(
            `UPDATE vehicles
             SET brand = COALESCE($1, brand),
                 model = COALESCE($2, model),
                 year = COALESCE($3, year),
                 license_plate = COALESCE($4, license_plate),
                 vin = COALESCE($5, vin),
                 color = COALESCE($6, color),
                 fuel_type = COALESCE($7, fuel_type),
                 mileage = COALESCE($8, mileage)
             WHERE id = $9
             RETURNING *`,
            [brand, model, year, license_plate, vin, color, fuel_type, mileage, vehicleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Araç bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Araç güncellendi',
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
            message: 'Araç silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Araç silinemedi',
            error: error.message
        });
    }
});

module.exports = router;

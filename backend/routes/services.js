// Servis Yönetimi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const { notifyServiceStarted, notifyServiceCompleted } = require('../services/notificationService');

// Tüm servisleri getir
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, v.brand, v.model, v.license_plate, c.name as customer_name
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             ORDER BY s.created_at DESC`
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Servisler alınamadı',
            error: error.message
        });
    }
});

// Servis detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;

        const result = await pool.query(
            `SELECT s.*, v.brand, v.model, v.license_plate, c.name as customer_name, c.phone, c.email
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             WHERE s.id = $1`,
            [serviceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servis bulunamadı'
            });
        }

        // Fotoğrafları getir
        const photosResult = await pool.query(
            'SELECT * FROM service_photos WHERE service_id = $1',
            [serviceId]
        );

        // Kullanılan parçaları getir
        const partsResult = await pool.query(
            `SELECT sp.*, p.part_name 
             FROM service_parts sp
             JOIN parts_inventory p ON sp.part_id = p.id
             WHERE sp.service_id = $1`,
            [serviceId]
        );

        res.json({
            success: true,
            data: {
                service: result.rows[0],
                photos: photosResult.rows,
                parts: partsResult.rows
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Servis alınamadı',
            error: error.message
        });
    }
});

// Yeni servis oluştur
router.post('/', async (req, res) => {
    try {
        const { 
            vehicle_id, 
            service_type_id, 
            service_description, 
            labor_cost, 
            parts_cost,
            notes,
            assigned_to 
        } = req.body;

        if (!vehicle_id) {
            return res.status(400).json({
                success: false,
                message: 'Araç seçilmesi gerekli'
            });
        }

        const totalCost = (parseFloat(labor_cost) || 0) + (parseFloat(parts_cost) || 0);

        const result = await pool.query(
            `INSERT INTO services (
                vehicle_id, service_type_id, service_description, 
                status, start_date, labor_cost, parts_cost, cost, 
                assigned_to, notes
            ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                vehicle_id, 
                service_type_id || null,
                service_description || null,
                'Beklemede',
                labor_cost || 0,
                parts_cost || 0,
                totalCost,
                assigned_to || null,
                notes || null
            ]
        );

        const service = result.rows[0];

        // Müşteriye bildirim gönder
        await notifyServiceStarted(service.id);

        res.status(201).json({
            success: true,
            message: 'Servis başarıyla oluşturuldu',
            data: service
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Servis oluşturulamadı',
            error: error.message
        });
    }
});

// Servis güncelle
router.put('/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { 
            status, 
            labor_cost, 
            parts_cost,
            service_description,
            notes,
            assigned_to
        } = req.body;

        const totalCost = (parseFloat(labor_cost) || 0) + (parseFloat(parts_cost) || 0);

        const result = await pool.query(
            `UPDATE services
             SET status = COALESCE($1, status),
                 labor_cost = COALESCE($2, labor_cost),
                 parts_cost = COALESCE($3, parts_cost),
                 cost = COALESCE($4, cost),
                 service_description = COALESCE($5, service_description),
                 notes = COALESCE($6, notes),
                 assigned_to = COALESCE($7, assigned_to),
                 end_date = CASE WHEN $1 = 'Tamamlandı' THEN NOW() ELSE end_date END
             WHERE id = $8
             RETURNING *`,
            [status, labor_cost, parts_cost, totalCost, service_description, notes, assigned_to, serviceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servis bulunamadı'
            });
        }

        const service = result.rows[0];

        // Servis tamamlanmışsa müşteriye bildirim gönder
        if (status === 'Tamamlandı') {
            await notifyServiceCompleted(service.id, totalCost);
        }

        res.json({
            success: true,
            message: 'Servis güncellendi',
            data: service
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Servis güncellenemedi',
            error: error.message
        });
    }
});

// Araç için servisleri getir
router.get('/vehicle/:vehicleId', async (req, res) => {
    try {
        const vehicleId = req.params.vehicleId;

        const result = await pool.query(
            'SELECT * FROM services WHERE vehicle_id = $1 ORDER BY created_at DESC',
            [vehicleId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Servisler alınamadı',
            error: error.message
        });
    }
});

// Servis sil
router.delete('/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;

        const result = await pool.query(
            'DELETE FROM services WHERE id = $1 RETURNING id',
            [serviceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servis bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Servis silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Servis silinemedi',
            error: error.message
        });
    }
});

module.exports = router;
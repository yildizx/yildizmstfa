// Servis Yönetimi Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dosya yükleme ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'));
        }
    }
});

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

        // Servis bilgisi
        const serviceResult = await pool.query(
            `SELECT s.*, v.brand, v.model, v.license_plate
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             WHERE s.id = $1`,
            [serviceId]
        );

        if (serviceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servis bulunamadı'
            });
        }

        // Servis fotoğrafları
        const photosResult = await pool.query(
            'SELECT * FROM service_photos WHERE service_id = $1 ORDER BY uploaded_at DESC',
            [serviceId]
        );

        // Servis raporları
        const reportResult = await pool.query(
            'SELECT * FROM service_reports WHERE service_id = $1',
            [serviceId]
        );

        res.json({
            success: true,
            data: {
                service: serviceResult.rows[0],
                photos: photosResult.rows,
                report: reportResult.rows[0] || null
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
        const { vehicle_id, service_type_id, service_description, cost, labor_cost, parts_cost, assigned_to, notes } = req.body;

        if (!vehicle_id) {
            return res.status(400).json({
                success: false,
                message: 'Araç ID gerekli'
            });
        }

        const result = await pool.query(
            `INSERT INTO services (vehicle_id, service_type_id, service_description, cost, labor_cost, parts_cost, assigned_to, notes, start_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             RETURNING *`,
            [vehicle_id, service_type_id, service_description, cost || 0, labor_cost || 0, parts_cost || 0, assigned_to, notes]
        );

        res.status(201).json({
            success: true,
            message: 'Servis oluşturuldu',
            data: result.rows[0]
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
        const { service_description, status, cost, labor_cost, parts_cost, assigned_to, notes, end_date } = req.body;

        const result = await pool.query(
            `UPDATE services
             SET service_description = COALESCE($1, service_description),
                 status = COALESCE($2, status),
                 cost = COALESCE($3, cost),
                 labor_cost = COALESCE($4, labor_cost),
                 parts_cost = COALESCE($5, parts_cost),
                 assigned_to = COALESCE($6, assigned_to),
                 notes = COALESCE($7, notes),
                 end_date = COALESCE($8, end_date)
             WHERE id = $9
             RETURNING *`,
            [service_description, status, cost, labor_cost, parts_cost, assigned_to, notes, end_date, serviceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servis bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Servis güncellendi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Servis güncellenemedi',
            error: error.message
        });
    }
});

// Servis fotoğrafı yükle
router.post('/:id/photos', upload.single('photo'), async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { description, photo_type } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Dosya yüklenmedi'
            });
        }

        const photoPath = `/uploads/${req.file.filename}`;

        const result = await pool.query(
            `INSERT INTO service_photos (service_id, photo_url, photo_path, description, photo_type)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [serviceId, photoPath, req.file.path, description || '', photo_type || 'during']
        );

        res.status(201).json({
            success: true,
            message: 'Fotoğraf yüklendi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fotoğraf yüklenemedi',
            error: error.message
        });
    }
});

// Servis fotoğraflarını getir
router.get('/:id/photos', async (req, res) => {
    try {
        const serviceId = req.params.id;

        const result = await pool.query(
            'SELECT * FROM service_photos WHERE service_id = $1 ORDER BY uploaded_at DESC',
            [serviceId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fotoğraflar alınamadı',
            error: error.message
        });
    }
});

// Fotoğraf sil
router.delete('/:id/photos/:photoId', async (req, res) => {
    try {
        const photoId = req.params.photoId;

        // Dosya bilgisini al
        const photoResult = await pool.query(
            'SELECT photo_path FROM service_photos WHERE id = $1',
            [photoId]
        );

        if (photoResult.rows.length > 0 && photoResult.rows[0].photo_path) {
            // Dosyayı sil
            fs.unlink(photoResult.rows[0].photo_path, (err) => {
                if (err) console.error('Dosya silme hatası:', err);
            });
        }

        // Veritabanından sil
        await pool.query('DELETE FROM service_photos WHERE id = $1', [photoId]);

        res.json({
            success: true,
            message: 'Fotoğraf silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fotoğraf silinemedi',
            error: error.message
        });
    }
});

module.exports = router;

// Raporlar Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// PDF rapor oluştur
router.get('/:id/pdf', async (req, res) => {
    try {
        const serviceId = req.params.id;

        // Servis bilgilerini getir
        const serviceResult = await pool.query(
            `SELECT s.*, v.brand, v.model, v.license_plate, c.name, c.phone, c.email, u.name as staff_name
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             LEFT JOIN users u ON s.assigned_to = u.id
             WHERE s.id = $1`,
            [serviceId]
        );

        if (serviceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servis bulunamadı'
            });
        }

        const service = serviceResult.rows[0];

        // Fotoğrafları getir
        const photosResult = await pool.query(
            'SELECT * FROM service_photos WHERE service_id = $1',
            [serviceId]
        );

        // PDF oluştur
        const doc = new PDFDocument();
        const fileName = `rapor-${serviceId}-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../../uploads', fileName);

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Başlık
        doc.fontSize(20).font('Helvetica-Bold').text('🔧 SERVİS RAPORU', { align: 'center' });
        doc.moveDown();

        // Müşteri Bilgileri
        doc.fontSize(12).font('Helvetica-Bold').text('MÜŞTERİ BİLGİLERİ');
        doc.fontSize(10).font('Helvetica').text(`Ad: ${service.name}`);
        doc.text(`Telefon: ${service.phone}`);
        doc.text(`Email: ${service.email || 'Belirtilmemiş'}`);
        doc.moveDown();

        // Araç Bilgileri
        doc.fontSize(12).font('Helvetica-Bold').text('ARAÇ BİLGİLERİ');
        doc.fontSize(10).font('Helvetica').text(`Marka/Model: ${service.brand} ${service.model}`);
        doc.text(`Plaka: ${service.license_plate}`);
        doc.moveDown();

        // Servis Bilgileri
        doc.fontSize(12).font('Helvetica-Bold').text('SERVİS BİLGİLERİ');
        doc.fontSize(10).font('Helvetica').text(`Tarih: ${new Date(service.start_date).toLocaleDateString('tr-TR')}`);
        doc.text(`Durum: ${service.status}`);
        doc.text(`Açıklama: ${service.service_description || 'Belirtilmemiş'}`);
        doc.text(`Personel: ${service.staff_name || 'Atanmamış'}`);
        doc.moveDown();

        // Maliyet Bilgileri
        doc.fontSize(12).font('Helvetica-Bold').text('MALİYET BİLGİLERİ');
        doc.fontSize(10).font('Helvetica').text(`İşçilik: ₺${service.labor_cost || 0}`);
        doc.text(`Parça: ₺${service.parts_cost || 0}`);
        doc.text(`Toplam: ₺${service.cost || 0}`);
        doc.moveDown();

        // Notlar
        if (service.notes) {
            doc.fontSize(12).font('Helvetica-Bold').text('NOTLAR');
            doc.fontSize(10).font('Helvetica').text(service.notes);
            doc.moveDown();
        }

        doc.end();

        stream.on('finish', () => {
            res.download(filePath, `rapor-${serviceId}.pdf`, (err) => {
                if (err) console.error('Download hatası:', err);
                // Dosyayı temizle
                fs.unlink(filePath, () => {});
            });
        });

        stream.on('error', (error) => {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({
                success: false,
                message: 'PDF oluşturulamadı',
                error: error.message
            });
        });
    } catch (error) {
        console.error('Rapor hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Rapor oluşturulamadı',
            error: error.message
        });
    }
});

// Servis raporunu getir
router.get('/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;

        const result = await pool.query(
            'SELECT * FROM service_reports WHERE service_id = $1',
            [serviceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rapor bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Rapor alınamadı',
            error: error.message
        });
    }
});

// Rapor oluştur/güncelleştir
router.post('/', async (req, res) => {
    try {
        const {
            service_id,
            report_content,
            total_cost,
            estimated_completion_date,
            recommendations,
            warranty_info
        } = req.body;

        if (!service_id || !report_content) {
            return res.status(400).json({
                success: false,
                message: 'Servis ve rapor içeriği gerekli'
            });
        }

        // Mevcut raporu kontrol et
        const existingResult = await pool.query(
            'SELECT id FROM service_reports WHERE service_id = $1',
            [service_id]
        );

        let result;
        if (existingResult.rows.length > 0) {
            // Güncelle
            result = await pool.query(
                `UPDATE service_reports
                 SET report_content = $1,
                     total_cost = $2,
                     estimated_completion_date = $3,
                     recommendations = $4,
                     warranty_info = $5,
                     updated_at = NOW()
                 WHERE service_id = $6
                 RETURNING *`,
                [report_content, total_cost, estimated_completion_date, recommendations, warranty_info, service_id]
            );
        } else {
            // Oluştur
            result = await pool.query(
                `INSERT INTO service_reports (
                    service_id, report_content, total_cost, 
                    estimated_completion_date, recommendations, warranty_info
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [service_id, report_content, total_cost, estimated_completion_date, recommendations, warranty_info]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Rapor kaydedildi',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Rapor kaydedilemedi',
            error: error.message
        });
    }
});

module.exports = router;
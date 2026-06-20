// Rapor ve PDF Rotası
const express = require('express');
const router = express.Router();
const pool = require('../config');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Servis raporı oluştur veya güncelle
router.post('/:serviceId', async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        const { report_content, total_cost, estimated_completion_date, recommendations, warranty_info } = req.body;

        // Mevcut rapor var mı kontrol et
        const existingReport = await pool.query(
            'SELECT id FROM service_reports WHERE service_id = $1',
            [serviceId]
        );

        let result;

        if (existingReport.rows.length > 0) {
            // Güncelle
            result = await pool.query(
                `UPDATE service_reports
                 SET report_content = $1,
                     total_cost = $2,
                     estimated_completion_date = $3,
                     recommendations = $4,
                     warranty_info = $5
                 WHERE service_id = $6
                 RETURNING *`,
                [report_content, total_cost, estimated_completion_date, recommendations, warranty_info, serviceId]
            );
        } else {
            // Oluştur
            result = await pool.query(
                `INSERT INTO service_reports (service_id, report_content, total_cost, estimated_completion_date, recommendations, warranty_info)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [serviceId, report_content, total_cost, estimated_completion_date, recommendations, warranty_info]
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
            message: 'Rapor oluşturulamadı',
            error: error.message
        });
    }
});

// Servis raporını getir
router.get('/:serviceId', async (req, res) => {
    try {
        const serviceId = req.params.serviceId;

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

// PDF Rapor Oluştur ve İndir
router.get('/:serviceId/pdf', async (req, res) => {
    try {
        const serviceId = req.params.serviceId;

        // Servis bilgilerini getir
        const serviceResult = await pool.query(
            `SELECT s.*, v.brand, v.model, v.license_plate, v.year, c.name as customer_name, c.phone, c.email
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
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

        // Raporu getir
        const reportResult = await pool.query(
            'SELECT * FROM service_reports WHERE service_id = $1',
            [serviceId]
        );

        const report = reportResult.rows[0];

        // PDF oluştur
        const doc = new PDFDocument();
        const filename = `rapor-${serviceId}-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../../uploads', filename);

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Başlık
        doc.fontSize(20).text('🔧 SERVİS RAPORU', { align: 'center' });
        doc.fontSize(12).text('Auto Repair System', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`);

        // Müşteri Bilgileri
        doc.fontSize(12).text('MÜŞTERİ BİLGİLERİ', { underline: true });
        doc.fontSize(10);
        doc.text(`Ad: ${service.customer_name}`);
        doc.text(`Telefon: ${service.phone}`);
        if (service.email) doc.text(`Email: ${service.email}`);
        doc.moveDown();

        // Araç Bilgileri
        doc.fontSize(12).text('ARAÇ BİLGİLERİ', { underline: true });
        doc.fontSize(10);
        doc.text(`Marka/Model: ${service.brand} ${service.model} (${service.year})`);
        doc.text(`Plaka: ${service.license_plate}`);
        doc.moveDown();

        // Servis Bilgileri
        doc.fontSize(12).text('SERVİS BİLGİLERİ', { underline: true });
        doc.fontSize(10);
        doc.text(`Açıklama: ${service.service_description || 'Belirtilmemiş'}`);
        doc.text(`Durum: ${service.status}`);
        doc.text(`Başlama Tarihi: ${new Date(service.start_date).toLocaleDateString('tr-TR')}`);
        if (service.end_date) {
            doc.text(`Bitiş Tarihi: ${new Date(service.end_date).toLocaleDateString('tr-TR')}`);
        }
        doc.moveDown();

        // Maliyet Bilgileri
        doc.fontSize(12).text('MALİYET BİLGİLERİ', { underline: true });
        doc.fontSize(10);
        doc.text(`İşçilik Maliyeti: ₺${(service.labor_cost || 0).toFixed(2)}`);
        doc.text(`Parça Maliyeti: ₺${(service.parts_cost || 0).toFixed(2)}`);
        doc.text(`Toplam Maliyet: ₺${(service.cost || 0).toFixed(2)}`, { bold: true });
        doc.moveDown();

        // Rapor Detayları
        if (report) {
            doc.fontSize(12).text('RAPOR DETAYLARI', { underline: true });
            doc.fontSize(10);
            doc.text(report.report_content, { align: 'left' });
            doc.moveDown();

            if (report.recommendations) {
                doc.fontSize(12).text('ÖNERİLER', { underline: true });
                doc.fontSize(10).text(report.recommendations);
                doc.moveDown();
            }

            if (report.warranty_info) {
                doc.fontSize(12).text('GARANTİ BİLGİSİ', { underline: true });
                doc.fontSize(10).text(report.warranty_info);
                doc.moveDown();
            }
        }

        // Notlar
        if (service.notes) {
            doc.fontSize(12).text('NOTLAR', { underline: true });
            doc.fontSize(10).text(service.notes);
        }

        doc.end();

        stream.on('finish', () => {
            res.download(filepath, filename, (err) => {
                if (err) console.error('İndir hatası:', err);
                // Dosyayı sil
                fs.unlink(filepath, (err) => {
                    if (err) console.error('Dosya silme hatası:', err);
                });
            });
        });
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'PDF oluşturulamadı',
            error: error.message
        });
    }
});

module.exports = router;

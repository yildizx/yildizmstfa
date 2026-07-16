// Bildirim Servisi
const nodemailer = require('nodemailer');
const pool = require('../config');

// Email gönderici ayarla
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Servis başladı bildirimi
const notifyServiceStarted = async (serviceId) => {
    try {
        const serviceResult = await pool.query(
            `SELECT s.*, v.brand, v.model, c.name, c.email, c.phone
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             WHERE s.id = $1`,
            [serviceId]
        );

        if (serviceResult.rows.length === 0) return;

        const service = serviceResult.rows[0];
        const customer = service;

        // Email gönder
        if (customer.email) {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: customer.email,
                subject: `🔧 Servis Başladı - ${service.brand} ${service.model}`,
                html: `
                    <h2>Merhaba ${customer.name}!</h2>
                    <p>Aracınız ${service.brand} ${service.model} için servis başlamıştır.</p>
                    <p><strong>Servis Açıklaması:</strong> ${service.service_description || 'Belirtilmemiş'}</p>
                    <p>Servis tamamlanması hakkında sizi bilgilendireceğiz.</p>
                    <p>İyi günler,<br/>Oto Tamirci Ekibi</p>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        // SMS gönder (Twilio - opsiyonel)
        if (process.env.TWILIO_ACCOUNT_SID && customer.phone) {
            console.log(`📱 SMS gönderilecek: ${customer.phone}`);
            // Twilio implementasyonu eklenebilir
        }

        // Log ekle
        await pool.query(
            `INSERT INTO notifications_log (customer_id, service_id, message, notification_type, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [customer.id, serviceId, `Servis başladı`, 'service_started', 'gönderildi']
        );
    } catch (error) {
        console.error('Bildirim gönderme hatası:', error);
    }
};

// Servis tamamlandı bildirimi
const notifyServiceCompleted = async (serviceId, totalCost) => {
    try {
        const serviceResult = await pool.query(
            `SELECT s.*, v.brand, v.model, c.name, c.email, c.phone
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             WHERE s.id = $1`,
            [serviceId]
        );

        if (serviceResult.rows.length === 0) return;

        const service = serviceResult.rows[0];
        const customer = service;

        // Email gönder
        if (customer.email) {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: customer.email,
                subject: `✅ Servis Tamamlandı - ${service.brand} ${service.model}`,
                html: `
                    <h2>Merhaba ${customer.name}!</h2>
                    <p>Aracınız ${service.brand} ${service.model} için servis tamamlanmıştır.</p>
                    <p><strong>Toplam Tutar:</strong> ₺${totalCost}</p>
                    <p>Aracınız almaya hazırdır. Lütfen bizimle iletişime geçiniz.</p>
                    <p>İyi günler,<br/>Oto Tamirci Ekibi</p>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        // Log ekle
        await pool.query(
            `INSERT INTO notifications_log (customer_id, service_id, message, notification_type, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [customer.id, serviceId, `Servis tamamlandı - ₺${totalCost}`, 'service_completed', 'gönderildi']
        );
    } catch (error) {
        console.error('Bildirim gönderme hatası:', error);
    }
};

// Ödeme hatırlatması
const notifyPaymentReminder = async (customerId, serviceId, amount) => {
    try {
        const customerResult = await pool.query(
            'SELECT * FROM customers WHERE id = $1',
            [customerId]
        );

        if (customerResult.rows.length === 0) return;

        const customer = customerResult.rows[0];

        // Email gönder
        if (customer.email) {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: customer.email,
                subject: `💳 Ödeme Hatırlatması - ₺${amount}`,
                html: `
                    <h2>Merhaba ${customer.name}!</h2>
                    <p>Hala ödenmemiş servis bedeli bulunmaktadır.</p>
                    <p><strong>Ödenmesi Gereken Tutar:</strong> ₺${amount}</p>
                    <p>Lütfen en kısa sürede ödemenizi yapınız.</p>
                    <p>Sorularınız için bizimle iletişime geçebilirsiniz:<br/>
                    📞 ${customer.phone}</p>
                    <p>İyi günler,<br/>Oto Tamirci Ekibi</p>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        // Log ekle
        await pool.query(
            `INSERT INTO notifications_log (customer_id, service_id, message, notification_type, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [customerId, serviceId, `Ödeme hatırlatması - ₺${amount}`, 'payment_reminder', 'gönderildi']
        );
    } catch (error) {
        console.error('Bildirim gönderme hatası:', error);
    }
};

module.exports = {
    notifyServiceStarted,
    notifyServiceCompleted,
    notifyPaymentReminder
};

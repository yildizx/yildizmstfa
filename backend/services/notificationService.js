// Bildirim Servisi
const nodemailer = require('nodemailer');
const pool = require('../config');

// Email transporter ayarı
const emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// ==================== BİLDİRİM GÖNDERME FONKSİYONLARI ====================

// Email gönder
async function sendEmailNotification(customerEmail, subject, message) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: customerEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>🔧 Oto Tamirci Sistemi</h2>
                    <p>${message}</p>
                    <hr/>
                    <p style="color: #888; font-size: 12px;">
                        Bu bildirim otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.
                    </p>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        return { success: true, method: 'email' };
    } catch (error) {
        console.error('Email gönderme hatası:', error);
        return { success: false, error: error.message };
    }
}

// SMS gönder (Twilio örneği - API entegrasyonu gerekli)
async function sendSmsNotification(phone, message) {
    try {
        // Twilio veya benzeri SMS API'sini buraya entegre edin
        // Örnek: const twilio = require('twilio');
        // Şimdilik simülasyon yapıyoruz
        console.log(`📱 SMS gönderildi: ${phone} - ${message}`);
        return { success: true, method: 'sms' };
    } catch (error) {
        console.error('SMS gönderme hatası:', error);
        return { success: false, error: error.message };
    }
}

// WhatsApp gönder (Twilio WhatsApp API örneği)
async function sendWhatsAppNotification(phone, message) {
    try {
        // WhatsApp API entegrasyonu (Twilio gibi)
        console.log(`💬 WhatsApp gönderildi: ${phone} - ${message}`);
        return { success: true, method: 'whatsapp' };
    } catch (error) {
        console.error('WhatsApp gönderme hatası:', error);
        return { success: false, error: error.message };
    }
}

// ==================== BİLDİRİM TÜRLERI ====================

// Servis Başladı Bildirimi
async function notifyServiceStarted(serviceId) {
    try {
        // Servis bilgilerini getir
        const serviceResult = await pool.query(
            `SELECT s.*, v.brand, v.model, c.name, c.phone, c.email
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             WHERE s.id = $1`,
            [serviceId]
        );

        if (serviceResult.rows.length === 0) return;

        const service = serviceResult.rows[0];
        const message = `Merhaba ${service.name}, ${service.brand} ${service.model} araçınızın servisi başlamıştır. Durum takibi için sitemizi ziyaret edebilirsiniz.`;

        // Bildirim ayarlarını getir
        const settingsResult = await pool.query(
            'SELECT * FROM notification_settings WHERE customer_id = $1',
            [service.customer_id || 1]
        );

        const settings = settingsResult.rows[0] || { send_email: true, send_sms: true };

        // Email gönder
        if (settings.send_email && service.email) {
            await sendEmailNotification(
                service.email,
                '🔧 Servis Başladı',
                `${message}`
            );
        }

        // SMS gönder
        if (settings.send_sms && service.phone) {
            await sendSmsNotification(service.phone, message);
        }

        // Log'a kaydet
        await logNotification(service.customer_id, serviceId, message, 'servis_başladı');
    } catch (error) {
        console.error('Servis başlama bildirimi hatası:', error);
    }
}

// Servis Tamamlandı Bildirimi
async function notifyServiceCompleted(serviceId, cost) {
    try {
        const serviceResult = await pool.query(
            `SELECT s.*, v.brand, v.model, c.name, c.phone, c.email
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             JOIN customers c ON v.customer_id = c.id
             WHERE s.id = $1`,
            [serviceId]
        );

        if (serviceResult.rows.length === 0) return;

        const service = serviceResult.rows[0];
        const message = `Merhaba ${service.name}, ${service.brand} ${service.model} araçınızın servisi tamamlanmıştır. Toplam maliyet: ₺${cost}. Detaylar için lütfen web sitemize giriş yapınız.`;

        const settingsResult = await pool.query(
            'SELECT * FROM notification_settings WHERE customer_id = $1',
            [service.customer_id || 1]
        );

        const settings = settingsResult.rows[0] || { send_email: true, send_sms: true };

        if (settings.send_email && service.email) {
            await sendEmailNotification(
                service.email,
                '✅ Servis Tamamlandı',
                message
            );
        }

        if (settings.send_sms && service.phone) {
            await sendSmsNotification(service.phone, message);
        }

        await logNotification(service.customer_id, serviceId, message, 'servis_bitti');
    } catch (error) {
        console.error('Servis tamamlama bildirimi hatası:', error);
    }
}

// Ödeme Hatırlatması
async function notifyPaymentReminder(customerId, serviceId, amount) {
    try {
        const customerResult = await pool.query(
            'SELECT * FROM customers WHERE id = $1',
            [customerId]
        );

        if (customerResult.rows.length === 0) return;

        const customer = customerResult.rows[0];
        const message = `Merhaba ${customer.name}, servise ait ₺${amount} tutarındaki ödemeniz bekleniyor. Lütfen en kısa zamanda ödeme yapınız.`;

        const settingsResult = await pool.query(
            'SELECT * FROM notification_settings WHERE customer_id = $1',
            [customerId]
        );

        const settings = settingsResult.rows[0] || { send_email: true, send_sms: true };

        if (settings.send_email && customer.email) {
            await sendEmailNotification(
                customer.email,
                '💳 Ödeme Hatırlatması',
                message
            );
        }

        if (settings.send_sms && customer.phone) {
            await sendSmsNotification(customer.phone, message);
        }

        await logNotification(customerId, serviceId, message, 'ödeme_hatırlatması');
    } catch (error) {
        console.error('Ödeme hatırlatması hatası:', error);
    }
}

// Bildirim Log'u
async function logNotification(customerId, serviceId, message, type) {
    try {
        await pool.query(
            `INSERT INTO notifications_log (customer_id, service_id, message, notification_type, status)
             VALUES ($1, $2, $3, $4, 'gönderildi')`,
            [customerId, serviceId, message, type]
        );
    } catch (error) {
        console.error('Bildirim log'u hatası:', error);
    }
}

module.exports = {
    sendEmailNotification,
    sendSmsNotification,
    sendWhatsAppNotification,
    notifyServiceStarted,
    notifyServiceCompleted,
    notifyPaymentReminder,
    logNotification
};

-- PostgreSQL Veritabanı Şeması
-- Oto Tamirci Yönetim Sistemi

-- Kullanıcılar (Admin ve Çalışanlar)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff', -- 'admin', 'staff'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Müşteriler
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255),
    qr_code_id VARCHAR(50) UNIQUE,
    qr_code_data TEXT, -- QR kod base64
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Araçlar
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    vin VARCHAR(50),
    color VARCHAR(30),
    fuel_type VARCHAR(20), -- 'Benzin', 'Dizel', 'Elektrik', 'Hibrit'
    mileage INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servis Türleri
CREATE TABLE service_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servis Kayıtları
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type_id INT REFERENCES service_types(id),
    service_description VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Beklemede', -- 'Beklemede', 'Devam Ediyor', 'Tamamlandı', 'İptal'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    cost DECIMAL(10, 2),
    labor_cost DECIMAL(10, 2) DEFAULT 0,
    parts_cost DECIMAL(10, 2) DEFAULT 0,
    assigned_to INT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servis Fotoğrafları
CREATE TABLE service_photos (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    photo_url VARCHAR(255) NOT NULL,
    photo_path VARCHAR(255),
    description VARCHAR(255),
    photo_type VARCHAR(20), -- 'before', 'after', 'during'
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ödeme Takibi
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(30), -- 'Nakit', 'Kredi Kartı', 'Çek', 'Transfer'
    payment_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Beklemede', -- 'Beklemede', 'Ödendi', 'İade Edildi'
    notes TEXT,
    receipt_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bildirim Ayarları
CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    send_sms BOOLEAN DEFAULT true,
    send_email BOOLEAN DEFAULT true,
    send_whatsapp BOOLEAN DEFAULT false,
    notification_types VARCHAR(255), -- 'servis_başladı', 'servis_bitti', 'ödeme_hatırlatması'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gönderilen Bildirimler (Log)
CREATE TABLE notifications_log (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id),
    service_id INT REFERENCES services(id),
    message TEXT NOT NULL,
    notification_type VARCHAR(30),
    method VARCHAR(20), -- 'sms', 'email', 'whatsapp'
    status VARCHAR(20), -- 'gönderildi', 'başarısız', 'beklemede'
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servis Raporları
CREATE TABLE service_reports (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    report_content TEXT NOT NULL,
    total_cost DECIMAL(10, 2),
    estimated_completion_date DATE,
    recommendations TEXT,
    warranty_info TEXT,
    pdf_url VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yedek Parçalar Envanteri
CREATE TABLE parts_inventory (
    id SERIAL PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    part_code VARCHAR(50) UNIQUE,
    quantity INT DEFAULT 0,
    unit_cost DECIMAL(10, 2),
    supplier VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servis Kullanılan Parçalar
CREATE TABLE service_parts (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    part_id INT NOT NULL REFERENCES parts_inventory(id),
    quantity_used INT,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2)
);

-- İndeksler (Performans)
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_services_vehicle_id ON services(vehicle_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_start_date ON services(start_date);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_customer_id ON notifications_log(customer_id);

-- Tetikleyiciler (Otomatik güncelleme)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_reports_updated_at BEFORE UPDATE ON service_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== UPDATED SCHEMA ====================
-- Yeni ve güncellenmiş tablolar

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CUSTOMERS TABLE (UPDATED) ====================
-- Bireysel ve Kurumsal müşteriler
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_type VARCHAR(20) NOT NULL DEFAULT 'bireysel', -- 'bireysel' or 'kurumsal'
    name VARCHAR(255) NOT NULL, -- Müşteri adı (bireysel) veya Firma adı (kurumsal)
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    tax_id VARCHAR(50), -- Kurumsal için vergi numarası
    authorized_person VARCHAR(255), -- Kurumsal için yetkili kişi
    qr_code_id VARCHAR(50) UNIQUE,
    qr_code_data TEXT,
    is_active BOOLEAN DEFAULT true,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== VEHICLES TABLE (UPDATED) ====================
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(50), -- Şase numarası (VIN)
    color VARCHAR(100),
    fuel_type VARCHAR(50),
    mileage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE INTAKE TABLE (NEW) ====================
-- Araç servise alma işlemi
CREATE TABLE IF NOT EXISTS service_intake (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    intake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    intake_km INTEGER NOT NULL, -- Servise alındığı km
    customer_complaint TEXT, -- Müşteri şikayeti
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Aktif', -- 'Aktif', 'Tamamlandı'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE WORK TABLE (NEW) ====================
-- Serviste yapılan işler
CREATE TABLE IF NOT EXISTS service_work (
    id SERIAL PRIMARY KEY,
    service_intake_id INTEGER NOT NULL REFERENCES service_intake(id) ON DELETE CASCADE,
    work_description VARCHAR(255) NOT NULL, -- Yapılan iş tanımı
    work_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Yapan usta
    work_cost DECIMAL(10, 2) NOT NULL, -- İşçilik ücreti
    parts_cost DECIMAL(10, 2) DEFAULT 0, -- Parça maliyeti (otomatik stoktan düşülür)
    total_cost DECIMAL(10, 2) NOT NULL, -- Toplam maliyet
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE WORK ITEMS TABLE (NEW) ====================
-- Yapılan işlerde kullanılan malzeme/stok
CREATE TABLE IF NOT EXISTS service_work_items (
    id SERIAL PRIMARY KEY,
    service_work_id INTEGER NOT NULL REFERENCES service_work(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES parts_inventory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL, -- Kullanılan miktar
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SUBCONTRACTOR TABLE (NEW) ====================
-- Dış firmalardan alınan hizmetler
CREATE TABLE IF NOT EXISTS subcontractors (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    tax_id VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SUBCONTRACTOR WORK TABLE (NEW) ====================
-- Dış firmalardan alınan işler
CREATE TABLE IF NOT EXISTS subcontractor_work (
    id SERIAL PRIMARY KEY,
    service_work_id INTEGER NOT NULL REFERENCES service_work(id) ON DELETE CASCADE,
    subcontractor_id INTEGER NOT NULL REFERENCES subcontractors(id) ON DELETE RESTRICT,
    work_description VARCHAR(255) NOT NULL,
    work_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cost DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Borçlu', -- 'Borçlu', 'Ödendi'
    payment_date TIMESTAMP,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PARTS INVENTORY TABLE (UPDATED) ====================
CREATE TABLE IF NOT EXISTS parts_inventory (
    id SERIAL PRIMARY KEY,
    part_name VARCHAR(255) NOT NULL,
    part_code VARCHAR(100) UNIQUE,
    description TEXT,
    quantity INTEGER DEFAULT 0, -- Stok miktarı
    unit_price DECIMAL(10, 2) NOT NULL,
    minimum_quantity INTEGER DEFAULT 5, -- Minimum stok seviyesi
    supplier VARCHAR(255),
    category VARCHAR(100), -- Yedek parça kategorisi
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INVENTORY LOG TABLE (NEW) ====================
-- Stok giriş/çıkış logu
CREATE TABLE IF NOT EXISTS inventory_log (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES parts_inventory(id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL, -- 'Giriş', 'Çıkış', 'Düzeltme'
    quantity_change INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_type VARCHAR(50), -- 'service_work', 'manual_entry'
    reference_id INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE COMPLETION TABLE (NEW) ====================
-- Araç servisten çıkarma
CREATE TABLE IF NOT EXISTS service_completion (
    id SERIAL PRIMARY KEY,
    service_intake_id INTEGER NOT NULL UNIQUE REFERENCES service_intake(id) ON DELETE CASCADE,
    completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_km INTEGER NOT NULL, -- Teslim edilen km
    total_cost DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Peşin', 'Veresiye', 'Kredi Kartı'
    payment_status VARCHAR(50) DEFAULT 'Beklemede', -- 'Beklemede', 'Ödendi'
    payment_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CUSTOMER DEBT TABLE (NEW) ====================
-- Müşteri borç/alacak takibi
CREATE TABLE IF NOT EXISTS customer_debt (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    debt_type VARCHAR(50) NOT NULL, -- 'Borçlu', 'Alacaklı'
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'service', 'other'
    reference_id INTEGER,
    status VARCHAR(50) DEFAULT 'Açık', -- 'Açık', 'Kapalı'
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    payment_date TIMESTAMP,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SUBCONTRACTOR DEBT TABLE (NEW) ====================
-- Dış firma borç takibi
CREATE TABLE IF NOT EXISTS subcontractor_debt (
    id SERIAL PRIMARY KEY,
    subcontractor_id INTEGER NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
    debt_type VARCHAR(50) NOT NULL, -- 'Borçlu', 'Alacaklı'
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'subcontractor_work', 'other'
    reference_id INTEGER,
    status VARCHAR(50) DEFAULT 'Açık', -- 'Açık', 'Kapalı'
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    payment_date TIMESTAMP,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE REPORT TABLE (NEW) ====================
-- Servis raporu
CREATE TABLE IF NOT EXISTS service_reports (
    id SERIAL PRIMARY KEY,
    service_completion_id INTEGER NOT NULL UNIQUE REFERENCES service_completion(id) ON DELETE CASCADE,
    report_content TEXT,
    report_generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    report_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES ====================
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_service_intake_customer_id ON service_intake(customer_id);
CREATE INDEX idx_service_intake_vehicle_id ON service_intake(vehicle_id);
CREATE INDEX idx_service_intake_status ON service_intake(status);
CREATE INDEX idx_service_work_intake_id ON service_work(service_intake_id);
CREATE INDEX idx_service_work_technician_id ON service_work(technician_id);
CREATE INDEX idx_parts_inventory_category ON parts_inventory(category);
CREATE INDEX idx_parts_inventory_quantity ON parts_inventory(quantity);
CREATE INDEX idx_inventory_log_inventory_id ON inventory_log(inventory_id);
CREATE INDEX idx_customer_debt_customer_id ON customer_debt(customer_id);
CREATE INDEX idx_customer_debt_status ON customer_debt(status);
CREATE INDEX idx_subcontractor_debt_subcontractor_id ON subcontractor_debt(subcontractor_id);

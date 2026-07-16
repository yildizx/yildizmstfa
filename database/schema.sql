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

-- ==================== CUSTOMERS TABLE ====================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    qr_code_id VARCHAR(50) UNIQUE,
    qr_code_data TEXT,
    is_active BOOLEAN DEFAULT true,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== VEHICLES TABLE ====================
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(50),
    color VARCHAR(100),
    fuel_type VARCHAR(50),
    mileage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICES TABLE ====================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type_id INTEGER,
    service_description TEXT,
    status VARCHAR(50) DEFAULT 'Beklemede',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    labor_cost DECIMAL(10, 2) DEFAULT 0,
    parts_cost DECIMAL(10, 2) DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE PHOTOS TABLE ====================
CREATE TABLE IF NOT EXISTS service_photos (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    photo_type VARCHAR(50),
    photo_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE PARTS TABLE ====================
CREATE TABLE IF NOT EXISTS service_parts (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2)
);

-- ==================== PARTS INVENTORY TABLE ====================
CREATE TABLE IF NOT EXISTS parts_inventory (
    id SERIAL PRIMARY KEY,
    part_name VARCHAR(255) NOT NULL,
    part_code VARCHAR(100) UNIQUE,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10, 2),
    supplier VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Belirtilmemiş',
    status VARCHAR(50) DEFAULT 'Beklemede',
    payment_date TIMESTAMP,
    receipt_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SERVICE REPORTS TABLE ====================
CREATE TABLE IF NOT EXISTS service_reports (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    report_content TEXT,
    total_cost DECIMAL(10, 2),
    estimated_completion_date DATE,
    recommendations TEXT,
    warranty_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== NOTIFICATIONS LOG TABLE ====================
CREATE TABLE IF NOT EXISTS notifications_log (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'gönderildi',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== NOTIFICATION SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    send_email BOOLEAN DEFAULT true,
    send_sms BOOLEAN DEFAULT false,
    send_whatsapp BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES ====================
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_services_vehicle_id ON services(vehicle_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_created_at ON services(created_at);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_customer_id ON notifications_log(customer_id);

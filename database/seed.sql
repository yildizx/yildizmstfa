-- Örnek Veriler - Kurulum sonrası test için

-- Admin Kullanıcı Ekle (şifre: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@autoreparistem.com', '$2a$10$YourHashedPasswordHere', 'Oto Tamirci Admin', 'admin');

-- Servis Türleri
INSERT INTO service_types (name, description, default_cost) VALUES
('Yağ Değişimi', 'Motor yağı değişimi', 300),
('Fren Servisi', 'Fren pastası değişimi ve kontrolü', 800),
('Lastik Değişimi', '4 lastik değişimi ve balansı', 1200),
('Klima Servisi', 'Klima gaz dolumu ve temizliği', 500),
('Muayene', 'Araç tam muayenesi', 200),
('Harita Güncelleme', 'GPS navigasyon haritası güncelleme', 150);

-- Örnek Müşteri
INSERT INTO customers (name, phone, email, address, qr_code_id) VALUES
('Ahmet Yılmaz', '05321234567', 'ahmet@example.com', 'İstanbul, Kadıköy', 'CUST001');

-- Örnek Araç
INSERT INTO vehicles (customer_id, brand, model, year, license_plate, vin, color, fuel_type, mileage) VALUES
(1, 'Toyota', 'Corolla', 2020, '34ABC123', 'JTDKP5C18L1234567', 'Gümüş', 'Benzin', 45000);

-- Örnek Servis
INSERT INTO services (vehicle_id, service_type_id, service_description, status, start_date, cost) VALUES
(1, 1, 'Düzenli motor yağı değişimi', 'Tamamlandı', NOW() - INTERVAL '7 days', 350);

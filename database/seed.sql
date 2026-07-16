-- ==================== SEED DATA ====================
-- Test verilerini yüklemek için bu dosyayı çalıştırın

-- Admin kullanıcı oluştur
INSERT INTO users (email, password_hash, name, role) VALUES (
    'admin@autoreparistem.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS/xvxCod5KOm', -- bcrypt hash of 'admin123'
    'Admin Kullanıcı',
    'admin'
) ON CONFLICT DO NOTHING;

-- Test müşteri oluştur
INSERT INTO customers (name, phone, email, address, qr_code_id) VALUES (
    'Ahmet Yılmaz',
    '+90 555 123 4567',
    'ahmet@example.com',
    'Ankara, Çankaya, Atatürk Caddesi',
    'CUST001'
),
(
    'Fatma Çetin',
    '+90 555 234 5678',
    'fatma@example.com',
    'İstanbul, Beşiktaş, Barbaros Bulvarı',
    'CUST002'
),
(
    'Mehmet Demir',
    '+90 555 345 6789',
    'mehmet@example.com',
    'İzmir, Alsancak, Alsancak Sokak',
    'CUST003'
) ON CONFLICT DO NOTHING;

-- Test araç oluştur
INSERT INTO vehicles (customer_id, brand, model, year, license_plate, vin, color, fuel_type, mileage) VALUES (
    1,
    'Toyota',
    'Corolla',
    2019,
    '34-ABC-123',
    'JT1BF18K5D0123456',
    'Gümüş',
    'Benzin',
    45000
),
(
    1,
    'Honda',
    'Civic',
    2020,
    '34-XYZ-789',
    'JH2E06520LM123456',
    'Siyah',
    'Benzin',
    32000
),
(
    2,
    'Ford',
    'Focus',
    2018,
    '34-DEF-456',
    '1FAFP3F98JG123456',
    'Beyaz',
    'Dizel',
    67000
),
(
    3,
    'Renault',
    'Megane',
    2017,
    '35-GHI-789',
    'VF15RCF5M45123456',
    'Kırmızı',
    'Benzin',
    85000
) ON CONFLICT DO NOTHING;

-- Test servis oluştur
INSERT INTO services (vehicle_id, service_description, status, labor_cost, parts_cost, cost, notes) VALUES (
    1,
    'Yağ değişimi ve filtre',
    'Tamamlandı',
    150.00,
    250.00,
    400.00,
    'Tüm filtreleri değiştirdik, yağ önerilen türde seçildi.'
),
(
    1,
    'Fren servisi',
    'Devam Ediyor',
    300.00,
    500.00,
    800.00,
    'Ön ve arka fren balataları değiştirilecek.'
),
(
    2,
    'Klima servisi',
    'Beklemede',
    200.00,
    150.00,
    350.00,
    'Klima gazı doldurmak gerekli.'
),
(
    3,
    'Elektrik arızası',
    'Tamamlandı',
    400.00,
    300.00,
    700.00,
    'Alternatör hasarlı, yeni bir tane takıldı.'
) ON CONFLICT DO NOTHING;

-- Test ödeme oluştur
INSERT INTO payments (service_id, customer_id, amount, payment_method, status) VALUES (
    1,
    1,
    400.00,
    'Kredi Kartı',
    'Ödendi'
),
(
    3,
    2,
    350.00,
    'Nakit',
    'Beklemede'
),
(
    4,
    3,
    700.00,
    'Banka Transferi',
    'Ödendi'
) ON CONFLICT DO NOTHING;

-- Bildirim ayarları
INSERT INTO notification_settings (customer_id, send_email, send_sms, send_whatsapp) VALUES (
    1,
    true,
    true,
    false
),
(
    2,
    true,
    false,
    true
),
(
    3,
    true,
    true,
    true
) ON CONFLICT DO NOTHING;

COMMIT;

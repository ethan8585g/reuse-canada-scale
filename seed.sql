-- ============================================
-- SEED DATA FOR LOCAL DEVELOPMENT ONLY
-- ============================================
-- Do NOT apply this to reuse-canada-production. It was applied there once and
-- put PLAINTEXT into employees.password_hash / customers.password_hash, which
-- verifyPassword() accepts as a legacy value -- so real accounts sat readable
-- in the database until someone happened to log in and trigger the upgrade.
--
-- Passwords below are now stored as PBKDF2 hashes, the same format
-- hashPassword() produces, so this file can never re-create that situation.
-- The dev passwords themselves are unchanged.

-- ═══ PRIMARY CREDENTIALS ═══

-- Reuse Canada Employee - Ethan
INSERT OR IGNORE INTO employees (email, password_hash, first_name, last_name, phone, role) VALUES 
  ('Ethan@reuse-canada.ca', 'pbkdf2$100000$hY66jNwsrH4tWC2tJUTMng==$UZQgNibk9P/2naOq4wVgLfO2Cdu2QtlBK+JvfVxT3O8=', 'Ethan', 'Reuse', '780-555-0100', 'admin');

-- Additional employees
INSERT OR IGNORE INTO employees (email, password_hash, first_name, last_name, phone, role) VALUES 
  ('admin@reusecanada.ca', 'pbkdf2$100000$oXThOteiOdUsFmrz7VQxBA==$2oUpuryBQnHBVPuQe6qrwEEpZB4FzOPnLGmlN8Ld34w=', 'Admin', 'User', '780-555-0110', 'admin'),
  ('mike@reusecanada.ca', 'pbkdf2$100000$G5Vk7N3ur9nfwWm+XaAzHA==$keKDvVvfKa3wXCmmvisoYTp/xF1IUKifVJES5Qxujjo=', 'Mike', 'Johnson', '780-555-0101', 'driver'),
  ('sarah@reusecanada.ca', 'pbkdf2$100000$tPmRsJxIXCVuC9zS+XK4sw==$AsVL/hjxwbSiTI02yMV2davXxmDYbM+l+qezlUn/H4k=', 'Sarah', 'Williams', '780-555-0102', 'driver'),
  ('james@reusecanada.ca', 'pbkdf2$100000$3ogelfJvPVN4S+hPNgRMTg==$Vl+oNrjLg3h2DFVAhVpx/wDd5Stqp/RuqS+hModdgi8=', 'James', 'Brown', '780-555-0103', 'yard_operator');

-- ═══ PRIMARY CUSTOMER ═══

-- Kal Tire - Customer Login
INSERT OR IGNORE INTO customers (email, password_hash, company_name, contact_name, phone, address, city, province, postal_code, lat, lng) VALUES 
  ('KALTIRE', 'pbkdf2$100000$iQ8tRCf85EsrY/sws56wXg==$tUNZertAMnF24hXxIme5nkNNGPYz76Mf64D1NPs1ddQ=', 'Kal Tire - Edmonton South', 'David Chen', '780-555-0201', '3803 Calgary Trail NW', 'Edmonton', 'AB', 'T6J 2A8', 53.4822, -113.4909);

-- Additional test customers
INSERT OR IGNORE INTO customers (email, password_hash, company_name, contact_name, phone, address, city, province, postal_code, lat, lng) VALUES 
  ('manager@canadiantire362.ca', 'pbkdf2$100000$KlOt7kt51Ty+0QFGDotE9w==$6m62JoYW+NaNra37IL7BfTvF55bE04oFyCaX4DuDar0=', 'Canadian Tire #362', 'Lisa Park', '780-555-0202', '14023 Victoria Trail NW', 'Edmonton', 'AB', 'T5Y 0S4', 53.6010, -113.4170),
  ('ops@fountaintire.ca', 'pbkdf2$100000$gXerev+4MvaaZnWbg8u5fQ==$SdqXmY2cgT3+Op7+aRbqa3+yNv1KWb8JHb6XG+961RY=', 'Fountain Tire - Sherwood Park', 'Robert Miller', '780-555-0203', '975 Broadmoor Blvd', 'Sherwood Park', 'AB', 'T8A 5W9', 53.5344, -113.2780),
  ('contact@ok-tire-leduc.ca', 'pbkdf2$100000$mkswnNnCRC3OC9tr0xZ5PQ==$2cGVai7q3qZCM8Gr8qfzAmENeZSRCULl5WTozPNtdag=', 'OK Tire - Leduc', 'Angela Torres', '780-555-0204', '4710 50 Ave', 'Leduc', 'AB', 'T9E 6W3', 53.2594, -113.5490),
  ('shop@quicklane-west.ca', 'pbkdf2$100000$HxkMSXY9TMupPIem7IHj8g==$se+OVsRUeV04rTmsjwjiiXp0JE/bEbAP9QjBRXJ6gwQ=', 'Quick Lane - West Edmonton', 'Tom Bradley', '780-555-0205', '17503 105 Ave NW', 'Edmonton', 'AB', 'T5S 1G4', 53.5421, -113.5995);

-- Sample pickup requests
INSERT OR IGNORE INTO pickup_requests (customer_id, status, estimated_tire_count, tire_type, preferred_date, preferred_time_slot, notes) VALUES 
  (1, 'pending', 85, 'mixed', '2026-03-25', 'morning', 'Tires in back lot, cage is full'),
  (2, 'confirmed', 120, 'passenger', '2026-03-25', 'afternoon', 'Two cages ready'),
  (3, 'pending', 45, 'truck', '2026-03-26', 'anytime', 'Large truck tires, need flatbed'),
  (4, 'scheduled', 60, 'passenger', '2026-03-24', 'morning', 'Regular weekly pickup'),
  (5, 'pending', 200, 'mixed', '2026-03-27', 'morning', 'Seasonal rush - extra tires');

-- Sample vehicles
INSERT OR IGNORE INTO vehicles (name, plate_number, vehicle_type, tare_weight) VALUES
  ('Truck 1 - Flatbed', 'ABC-1234', 'flatbed', 8200),
  ('Truck 2 - Roll-Off', 'DEF-5678', 'roll_off', 12500),
  ('Van 1 - Cube', 'GHI-9012', 'cube_van', 4800);

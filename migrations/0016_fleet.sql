-- ============================================
-- MIGRATION 0015: Fleet / "My Garage"
-- ============================================
-- The vehicles table existed only to populate dropdowns (name, plate, type,
-- tare). Everything the garage screen needs -- odometer, expiry dates, fuel,
-- work orders, documents -- is new.
--
-- Odometer note: the yard loader is metered in HOURS, not km. is_hours = 1
-- switches every label and interval on that unit, so odometer stores whichever
-- unit that vehicle uses rather than forcing a second column.

ALTER TABLE vehicles ADD COLUMN model TEXT;
ALTER TABLE vehicles ADD COLUMN vin TEXT;
ALTER TABLE vehicles ADD COLUMN icon TEXT;
ALTER TABLE vehicles ADD COLUMN photo TEXT;
ALTER TABLE vehicles ADD COLUMN odometer REAL DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN is_hours INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN insurance_expiry TEXT;
ALTER TABLE vehicles ADD COLUMN registration_expiry TEXT;
ALTER TABLE vehicles ADD COLUMN cvip_expiry TEXT;
ALTER TABLE vehicles ADD COLUMN service_interval REAL;
ALTER TABLE vehicles ADD COLUMN service_last REAL;
ALTER TABLE vehicles ADD COLUMN tire_interval REAL;
ALTER TABLE vehicles ADD COLUMN tire_last REAL;

-- ── Fuel fill-ups ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fuel_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  employee_id INTEGER REFERENCES employees(id),
  filled_at DATETIME NOT NULL,
  station TEXT,
  odometer REAL,
  litres REAL,
  price_per_litre REAL,
  total REAL,
  receipt_photo TEXT,          -- base64, same convention as scale ticket photos
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_filled ON fuel_logs(filled_at DESC);

-- ── Work orders: service, repairs, inspections ───────────────────────────
CREATE TABLE IF NOT EXISTS work_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  title TEXT NOT NULL,
  work_type TEXT NOT NULL DEFAULT 'maintenance', -- maintenance, repair, inspection
  shop TEXT,
  status TEXT NOT NULL DEFAULT 'open',           -- open, scheduled, completed
  scheduled_date TEXT,
  completed_date TEXT,
  odometer REAL,
  cost REAL,
  parts TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES employees(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- ── Compliance documents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_docs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  kind TEXT NOT NULL,            -- Insurance, Registration, CVIP Inspection
  provider TEXT,
  doc_number TEXT,
  expires_on TEXT,
  annual_cost REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_compliance_vehicle ON compliance_docs(vehicle_id);

-- ── Per-vehicle notes (defect / driver / shop / general) ─────────────────
CREATE TABLE IF NOT EXISTS vehicle_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  employee_id INTEGER REFERENCES employees(id),
  pin TEXT NOT NULL DEFAULT 'general',
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehicle_notes_vehicle ON vehicle_notes(vehicle_id);

-- ── Who has which truck today ────────────────────────────────────────────
-- One row per vehicle per day; re-assigning replaces rather than appends.
CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  employee_id INTEGER REFERENCES employees(id),
  assigned_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assign_vehicle_date ON vehicle_assignments(vehicle_id, assigned_date);

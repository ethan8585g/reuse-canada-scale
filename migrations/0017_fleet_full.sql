-- ============================================
-- MIGRATION 0017: Rest of the My Garage design
-- ============================================
-- Inspections, attachments, the parts catalogue, per-vehicle shop specs,
-- reminder channels and the IFTA jurisdiction on a fill-up.

-- Shop reference ("Settings & Manual") is a small, per-vehicle, free-shaped
-- document: groups of key/value rows that differ per make. JSON in one column
-- beats a specs table nobody would ever query relationally.
ALTER TABLE vehicles ADD COLUMN specs TEXT;

-- IFTA is built from where the fuel was bought and how far the unit ran.
ALTER TABLE fuel_logs ADD COLUMN province TEXT;
ALTER TABLE fuel_logs ADD COLUMN distance_km REAL;

-- Reminder channels per document.
ALTER TABLE compliance_docs ADD COLUMN remind_email INTEGER DEFAULT 1;
ALTER TABLE compliance_docs ADD COLUMN remind_sms INTEGER DEFAULT 0;
ALTER TABLE compliance_docs ADD COLUMN remind_driver INTEGER DEFAULT 0;

-- ── Driver pre-trip inspections ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  employee_id INTEGER REFERENCES employees(id),
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  result TEXT NOT NULL DEFAULT 'pass',   -- pass | defect
  items TEXT,                            -- JSON [{label, ok}]
  notes TEXT,
  work_order_id INTEGER REFERENCES work_orders(id)
);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_at ON inspections(submitted_at DESC);

-- ── Attachments (photos, CVIP certs, shop invoices) ──────────────────────
-- Follows the existing base64-in-TEXT convention used by scale ticket photos.
-- Capped in the API: D1 rows are not a blob store.
CREATE TABLE IF NOT EXISTS vehicle_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  employee_id INTEGER REFERENCES employees(id),
  name TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehicle_files_vehicle ON vehicle_files(vehicle_id);

-- ── Parts catalogue with OEM + cross reference ───────────────────────────
CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  oem TEXT,
  cross_ref TEXT,      -- comma separated
  fits TEXT,
  price REAL,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(name);

INSERT OR IGNORE INTO parts (id, name, oem, cross_ref, fits, price, tags) VALUES
 (1,'Engine Oil Filter','Cummins 3401544 / Fleetguard LF9080','WIX 57620,Baldwin B7577,Donaldson P550949,NAPA 1620','Heavy truck',34.90,'oil filter lf9080 3401544 lube'),
 (2,'Fuel Filter / Water Separator','Fleetguard FS19765','Racor R90T,WIX 33528,Baldwin BF1391,Donaldson P551000','Heavy truck',41.25,'fuel filter water separator fs19765 diesel'),
 (3,'Primary Air Filter','Donaldson P618848','Fleetguard AF26165,WIX 49964,Baldwin RS5721','Heavy truck',88.00,'air filter p618848 intake'),
 (4,'Brake Chamber 30/30','Bendix EV-30 Spring Brake','MGM TR3030,Haldex 123456,Sealco 3030','Air brake truck',96.50,'brake chamber 3030 air brakes'),
 (5,'Steer Tire 11R22.5','Michelin XZE2+ 11R22.5 16PR','Bridgestone R268,Goodyear G661,Continental HSR2','Heavy truck',412.00,'tire 11r22.5 steer rubber'),
 (6,'Hydraulic Return Filter','Hitachi 4294130','Donaldson P164378,Baldwin PT8964,WIX 51551','Loader',77.40,'hydraulic filter loader 4294130'),
 (7,'Engine Oil Filter - Isuzu 4HK1','Hitachi 4630525 / Isuzu 8-98018858','Donaldson P502465,Baldwin B7577,WIX 57620','Loader',28.60,'oil filter loader 4hk1 4630525'),
 (8,'Loader Tire 20.5R25 L3','Michelin XHA2 20.5R25','Bridgestone VJT,Titan LD250','Loader',1980.00,'tire 20.5r25 loader'),
 (9,'Oil Filter - 6.7L Power Stroke','Motorcraft FL-2051-S','WIX 57314,Fram PH11060,Baldwin B7599','Pickup',19.80,'oil filter ford powerstroke fl2051'),
 (10,'Oil Filter - Hino J08E','Hino S1560-72430','Donaldson P550920,WIX 57202,Baldwin B7391','Cube van',24.40,'oil filter hino j08e s1560'),
 (11,'DEF Filter Kit','Cummins 5303363','Fleetguard UF101,Donaldson P579115','Heavy truck',29.00,'def urea filter 5303363 aftertreatment'),
 (12,'Serpentine Belt','Gates K081264HD','Dayco 5081264,Goodyear 4081264,NAPA 25-081264','Heavy truck',52.00,'belt serpentine k081264 accessory drive');

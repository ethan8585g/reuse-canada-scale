-- ============================================
-- MIGRATION 0013: Overhead Crane Ticketing
-- ============================================
-- Parallel module to Scale House. Same hardware family (Western APX indicator
-- + IRXON RS-232↔BT adapter), but a SEPARATE physical indicator and a fully
-- separate ticket/audit/pricing stack so the two yards can operate
-- simultaneously without ticket numbers, settlements, or pricing colliding.
--
-- Walk-In sentinel customer (email walk-in@reuse-canada.local, provisioned by
-- migration 0007) is reused — no second sentinel needed.

-- ─────────────────────────────────────────────
-- Crane tickets — mirrors scale_tickets shape
-- Ticket number prefix: RC-CR-YYYY-NNNNN
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE NOT NULL,
  pickup_request_id INTEGER,
  customer_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  route_stop_id INTEGER,

  -- Field data (kept for parity; crane operators rarely populate these)
  field_store_name TEXT,
  field_employee_name TEXT,
  field_estimated_tires INTEGER,
  field_signature_data TEXT,
  field_cage_photo_url TEXT,
  field_notes TEXT,
  field_completed_at DATETIME,

  -- Weigh-in / weigh-out (crane analog: loaded vs. hook-only)
  weight_in REAL,
  weight_in_at DATETIME,
  weight_out REAL,
  weight_out_at DATETIME,
  net_weight REAL,

  -- Photos
  photo_in TEXT,
  photo_out TEXT,
  photo_in_at DATETIME,
  photo_out_at DATETIME,

  -- Material & pricing
  material_type TEXT,
  tire_count_actual INTEGER,
  material_grade TEXT,
  price_per_kg REAL,
  total_amount REAL,
  tax_rate REAL,
  tax_amount REAL,
  grand_total REAL,

  -- Payment
  payment_status TEXT,
  payment_method TEXT,
  square_payment_id TEXT,
  square_checkout_id TEXT,

  -- Vehicle/stored-tare (kept for parity, rarely used for crane)
  vehicle_id INTEGER,
  vehicle_plate TEXT,
  vehicle_tare_used INTEGER DEFAULT 0,

  -- Audit / status
  status TEXT NOT NULL DEFAULT 'field_pending',
  -- field_pending, field_complete, weighing_in, weighed_in, weighing_out, completed, voided
  completed_by INTEGER REFERENCES employees(id),
  voided_by INTEGER REFERENCES employees(id),
  void_reason TEXT,

  -- Receipt
  receipt_printed INTEGER DEFAULT 0,
  receipt_printed_at DATETIME,

  -- Misc
  manual_entry INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (route_stop_id) REFERENCES route_stops(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_crane_tickets_number ON crane_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_crane_tickets_customer ON crane_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_crane_tickets_employee ON crane_tickets(employee_id);
CREATE INDEX IF NOT EXISTS idx_crane_tickets_status ON crane_tickets(status);
CREATE INDEX IF NOT EXISTS idx_crane_tickets_created ON crane_tickets(created_at DESC);

-- ─────────────────────────────────────────────
-- Audit log
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crane_ticket_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  employee_id INTEGER,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crane_ticket_id) REFERENCES crane_tickets(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_crane_audit_log_ticket ON crane_audit_log(crane_ticket_id);
CREATE INDEX IF NOT EXISTS idx_crane_audit_log_action ON crane_audit_log(action);

-- ─────────────────────────────────────────────
-- Weight edits (admin/manager corrections with reason)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_weight_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crane_ticket_id INTEGER NOT NULL,
  field TEXT NOT NULL,
  old_value REAL NOT NULL,
  new_value REAL NOT NULL,
  reason TEXT NOT NULL,
  editor_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crane_ticket_id) REFERENCES crane_tickets(id),
  FOREIGN KEY (editor_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_crane_weight_edits_ticket ON crane_weight_edits(crane_ticket_id);

-- ─────────────────────────────────────────────
-- Anomalies (fraud / sanity-check flags)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crane_ticket_id INTEGER,
  anomaly_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  description TEXT,
  resolved INTEGER DEFAULT 0,
  resolved_by INTEGER,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crane_ticket_id) REFERENCES crane_tickets(id)
);

CREATE INDEX IF NOT EXISTS idx_crane_anomalies_ticket ON crane_anomalies(crane_ticket_id);
CREATE INDEX IF NOT EXISTS idx_crane_anomalies_type ON crane_anomalies(anomaly_type);

-- ─────────────────────────────────────────────
-- Daily payment batches (independent series from scale)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_payment_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_date TEXT NOT NULL UNIQUE,
  ticket_count INTEGER DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'open',
  settled_by INTEGER,
  settled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (settled_by) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_crane_batches_date ON crane_payment_batches(batch_date);

-- ─────────────────────────────────────────────
-- Crane pricing (separate material list from scale)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_type TEXT UNIQUE NOT NULL,
  description TEXT,
  price_per_kg REAL NOT NULL DEFAULT 0,
  price_per_tire REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed a single placeholder material so the pricing dropdown isn't empty on
-- first load. The operator should rename/replace this via the Materials &
-- Pricing card on the Overhead Crane page.
INSERT OR IGNORE INTO crane_pricing (material_type, description, price_per_kg, is_active)
VALUES ('mixed', 'Mixed Load', 0.14, 1);

-- ─────────────────────────────────────────────
-- Payment log — parallel ledger to payment_log so crane payments don't have
-- to squeeze into the scale_ticket_id NOT NULL slot. Same shape + same
-- partial UNIQUE on square_payment_id for Square retry idempotency.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_payment_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crane_ticket_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  square_payment_id TEXT,
  square_checkout_id TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crane_ticket_id) REFERENCES crane_tickets(id)
);

CREATE INDEX IF NOT EXISTS idx_crane_payment_log_ticket ON crane_payment_log(crane_ticket_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crane_payment_log_square_payment_id
  ON crane_payment_log(square_payment_id)
  WHERE square_payment_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- Live-weight bridge state — independent indicator from scale_bridge_state
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crane_bridge_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  weight_kg REAL NOT NULL DEFAULT 0,
  is_stable INTEGER NOT NULL DEFAULT 0,
  connection_mode TEXT,
  publisher_employee_id INTEGER REFERENCES employees(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO crane_bridge_state (id, weight_kg, is_stable, connection_mode, updated_at)
VALUES (1, 0, 0, NULL, CURRENT_TIMESTAMP);

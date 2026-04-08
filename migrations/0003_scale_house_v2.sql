-- ============================================
-- MIGRATION 0003: Scale House v2 — Camera, Audit, Stored Tare
-- ============================================

-- Photo capture per ticket (base64 JPEG from camera)
ALTER TABLE scale_tickets ADD COLUMN photo_in TEXT;
ALTER TABLE scale_tickets ADD COLUMN photo_out TEXT;
ALTER TABLE scale_tickets ADD COLUMN photo_in_at DATETIME;
ALTER TABLE scale_tickets ADD COLUMN photo_out_at DATETIME;

-- Stored tare flag (single-weigh using vehicle's known tare)
ALTER TABLE scale_tickets ADD COLUMN vehicle_tare_used INTEGER DEFAULT 0;

-- Audit: who completed / voided
ALTER TABLE scale_tickets ADD COLUMN completed_by INTEGER REFERENCES employees(id);
ALTER TABLE scale_tickets ADD COLUMN voided_by INTEGER REFERENCES employees(id);
ALTER TABLE scale_tickets ADD COLUMN void_reason TEXT;

-- Receipt tracking
ALTER TABLE scale_tickets ADD COLUMN receipt_printed INTEGER DEFAULT 0;
ALTER TABLE scale_tickets ADD COLUMN receipt_printed_at DATETIME;

-- Stored tare weight on vehicles for repeat single-weigh transactions
ALTER TABLE vehicles ADD COLUMN stored_tare_weight REAL;

-- Audit log for all scale ticket actions
CREATE TABLE IF NOT EXISTS scale_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scale_ticket_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- created, weighed_in, weighed_out, assigned, voided, payment, receipt_printed
  employee_id INTEGER,
  details TEXT, -- JSON with contextual data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scale_ticket_id) REFERENCES scale_tickets(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_ticket ON scale_audit_log(scale_ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON scale_audit_log(action);

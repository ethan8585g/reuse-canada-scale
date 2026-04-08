-- ============================================
-- MIGRATION 0004: Scale House v3 — Weight Edits, Fraud Detection, Settlement
-- ============================================

-- Weight edit history (corrections with full audit)
CREATE TABLE IF NOT EXISTS scale_weight_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scale_ticket_id INTEGER NOT NULL,
  field TEXT NOT NULL,
  old_value REAL NOT NULL,
  new_value REAL NOT NULL,
  reason TEXT NOT NULL,
  editor_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scale_ticket_id) REFERENCES scale_tickets(id),
  FOREIGN KEY (editor_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_weight_edits_ticket ON scale_weight_edits(scale_ticket_id);

-- Fraud / anomaly flags
CREATE TABLE IF NOT EXISTS weight_anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scale_ticket_id INTEGER,
  anomaly_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  description TEXT,
  resolved INTEGER DEFAULT 0,
  resolved_by INTEGER,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scale_ticket_id) REFERENCES scale_tickets(id)
);

CREATE INDEX IF NOT EXISTS idx_anomalies_ticket ON weight_anomalies(scale_ticket_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON weight_anomalies(anomaly_type);

-- Daily payment batches
CREATE TABLE IF NOT EXISTS payment_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_date TEXT NOT NULL,
  ticket_count INTEGER DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'open',
  settled_by INTEGER,
  settled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (settled_by) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_batches_date ON payment_batches(batch_date);

-- Add manual_entry flag to scale_tickets
ALTER TABLE scale_tickets ADD COLUMN manual_entry INTEGER DEFAULT 0;

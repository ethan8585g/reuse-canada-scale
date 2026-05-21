-- ============================================
-- MIGRATION 0005: Junk Removal Quote History
-- ============================================

CREATE TABLE IF NOT EXISTS junk_removal_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  items_description TEXT,
  volume_estimate TEXT,
  weight_tonnes REAL,
  job_time_min INTEGER,
  crew_size INTEGER,
  difficulty TEXT,
  special_notes TEXT,
  price_estimate_low INTEGER,
  price_estimate_high INTEGER,
  quote_summary TEXT,
  route_yard_to_job_km REAL,
  route_yard_to_job_min INTEGER,
  route_job_to_dump_km REAL,
  route_job_to_dump_min INTEGER,
  route_dump_to_yard_km REAL,
  route_dump_to_yard_min INTEGER,
  total_distance_km REAL,
  total_drive_min INTEGER,
  total_time_label TEXT,
  employee_id INTEGER REFERENCES employees(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_junk_quotes_created ON junk_removal_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_junk_quotes_employee ON junk_removal_quotes(employee_id);

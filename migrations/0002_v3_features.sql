-- v3 Feature Migrations
-- Region column for customers
ALTER TABLE customers ADD COLUMN region TEXT DEFAULT 'north';

-- Driver real-time status tracking
CREATE TABLE IF NOT EXISTS driver_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'idle',
  current_route_id INTEGER,
  last_lat REAL,
  last_lng REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Pickup proof of work (photo + GPS)
CREATE TABLE IF NOT EXISTS pickup_proof (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_request_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  photo_data TEXT,
  latitude REAL,
  longitude REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  notification_sent INTEGER DEFAULT 0,
  FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Notification log (SMS/Email)
CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  pickup_request_id INTEGER,
  status TEXT DEFAULT 'sent',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests(id)
);

-- Notify toggle for pickup requests
ALTER TABLE pickup_requests ADD COLUMN notify_customer INTEGER DEFAULT 0;

-- Seed driver_status for existing drivers
INSERT OR IGNORE INTO driver_status (employee_id, status)
SELECT id, 'idle' FROM employees WHERE role = 'driver' AND is_active = 1;

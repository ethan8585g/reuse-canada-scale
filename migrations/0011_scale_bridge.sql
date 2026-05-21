-- Scale-bridge live-weight state.
-- The scale-house terminal holds the only Web Bluetooth connection to the
-- Western APX indicator; this single-row table lets it publish the current
-- reading so other clients (phones, the office, the scale-tickets weight
-- modal) can pull the same value without their own BT pairing.
-- Single row pattern (id = 1) because operations are single-yard.

CREATE TABLE IF NOT EXISTS scale_bridge_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  weight_kg REAL NOT NULL DEFAULT 0,
  is_stable INTEGER NOT NULL DEFAULT 0,
  connection_mode TEXT,
  publisher_employee_id INTEGER REFERENCES employees(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO scale_bridge_state (id, weight_kg, is_stable, connection_mode, updated_at)
VALUES (1, 0, 0, NULL, CURRENT_TIMESTAMP);

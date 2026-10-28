-- Dispatch chat between each driver and the office, and trucks that drivers
-- set up themselves ("My Truck" in the driver portal).

-- One conversation per driver: driver_id is the thread key. Every admin and
-- manager sees and answers the same thread, so a reply from either is "dispatch".
-- read_at is set when the OTHER side opens the thread, which is what drives
-- the unread badges on both ends. 'system' rows are automatic notes (e.g. a
-- driver added a truck) and count as unread for the office.
CREATE TABLE IF NOT EXISTS dispatch_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL,
  sender_id INTEGER,
  sender_kind TEXT NOT NULL CHECK (sender_kind IN ('driver', 'dispatch', 'system')),
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (driver_id) REFERENCES employees(id)
);
CREATE INDEX IF NOT EXISTS idx_dispatch_messages_thread ON dispatch_messages(driver_id, id);
CREATE INDEX IF NOT EXISTS idx_dispatch_messages_unread ON dispatch_messages(sender_kind, read_at);

-- Files live in their own rows so listing a thread never ships file bodies.
-- Base64 like every other upload in this app (no R2 binding); size is the
-- decoded byte count, capped in src/routes/dispatch.ts.
CREATE TABLE IF NOT EXISTS dispatch_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES dispatch_messages(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dispatch_attachments_message ON dispatch_attachments(message_id);

-- A truck a driver set up from the portal. NULL = an office vehicle.
-- Drivers can only ever read or change rows where this is their own id.
ALTER TABLE vehicles ADD COLUMN owner_employee_id INTEGER REFERENCES employees(id);
ALTER TABLE vehicles ADD COLUMN year INTEGER;
ALTER TABLE vehicles ADD COLUMN color TEXT;
ALTER TABLE vehicles ADD COLUMN driver_notes TEXT;

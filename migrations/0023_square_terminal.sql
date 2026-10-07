-- ============================================
-- 0023: SQUARE TERMINAL -- charge the ticket automatically
-- ============================================
-- Once a ticket closes and its receipt has printed, the amount owed is sent
-- to Reuse Canada's Square Terminal ("$14.56 -- tap, insert or swipe").
--
-- The server decides the amount (grand_total from this database, never a
-- number from the browser), and Square reports the result back to the
-- server by webhook -- so a payment that lands while the Scale House tab is
-- reloading, or after the page stopped watching, still marks the ticket paid.

CREATE TABLE IF NOT EXISTS square_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  auto_charge INTEGER NOT NULL DEFAULT 0,          -- 1 = send every closed ticket to the Terminal
  device_id TEXT,                                  -- Terminal API device id (from a PAIRED device code)
  device_name TEXT,
  min_charge_cents INTEGER NOT NULL DEFAULT 500,   -- below this nothing is sent ($5.00)
  updated_by INTEGER REFERENCES employees(id),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO square_settings (id) VALUES (1);

-- One row per checkout sent to the Terminal. A row is written BEFORE Square
-- is called, which is what claims the ticket: the partial UNIQUE index below
-- allows only one live checkout per ticket, so two closes racing (the agent
-- and a hand-pressed button, a retried request) cannot put two charges on
-- the Terminal.
CREATE TABLE IF NOT EXISTS square_checkouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scale_ticket_id INTEGER NOT NULL REFERENCES scale_tickets(id),
  checkout_id TEXT UNIQUE,                         -- NULL until Square answers
  idempotency_key TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  device_id TEXT,
  -- PENDING | IN_PROGRESS | CANCEL_REQUESTED  (live)
  -- COMPLETED | CANCELED | FAILED             (finished; FAILED = Square refused it)
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_id TEXT,
  cancel_reason TEXT,
  error TEXT,
  source TEXT,                                     -- auto | manual | reprice
  created_by INTEGER REFERENCES employees(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_square_checkouts_one_live
  ON square_checkouts(scale_ticket_id)
  WHERE status IN ('PENDING', 'IN_PROGRESS', 'CANCEL_REQUESTED');
CREATE INDEX IF NOT EXISTS idx_square_checkouts_ticket ON square_checkouts(scale_ticket_id);
CREATE INDEX IF NOT EXISTS idx_square_checkouts_updated ON square_checkouts(updated_at);

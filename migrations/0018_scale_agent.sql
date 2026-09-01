-- ============================================
-- 0018: SCALE HOUSE AI AGENT
-- ============================================
-- Closed-loop scale ticketing. The agent wakes when the deck weight crosses a
-- threshold, decides whether the truck is ARRIVING (open a ticket) or LEAVING
-- (close the matching one, net = weight_in - weight_out), and prints.
--
-- The agent loop itself runs in the scale-house BROWSER tab, not in a Worker:
-- weight only arrives through Web Bluetooth / Web Serial / the localhost
-- bridge, and the USB Epson is only reachable via window.print(). A Worker can
-- neither sense nor actuate. These tables are the server-side decision record
-- and the shared configuration the browser loop reads.

-- One row per agent wake-up. This is both the audit trail and the tuning data:
-- every 'cancelled' row is a recorded case of the agent getting it wrong.
CREATE TABLE IF NOT EXISTS scale_agent_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weight_kg REAL NOT NULL,
  action TEXT NOT NULL,               -- new | close | defer
  ticket_id INTEGER,                  -- ticket opened or closed; NULL on defer
  confidence REAL,                    -- 0..1
  rule_fired TEXT,                    -- which decision rule matched
  reason TEXT,                        -- human-readable explanation
  open_ticket_count INTEGER,
  vision_used INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL,              -- acted | cancelled | deferred | dry_run | failed
  employee_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES scale_tickets(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_created
  ON scale_agent_decisions(created_at DESC);

-- Single-row configuration, same shape as scale_bridge_state.
-- Ships as 'dry_run': the loop runs and logs what it WOULD do, changes nothing.
CREATE TABLE IF NOT EXISTS scale_agent_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  mode TEXT NOT NULL DEFAULT 'dry_run',        -- off | dry_run | live
  wake_threshold_kg REAL NOT NULL DEFAULT 30,  -- deck occupied above this
  vehicle_floor_kg REAL NOT NULL DEFAULT 500,  -- but do not TICKET below this
  settle_seconds INTEGER NOT NULL DEFAULT 3,
  cancel_seconds INTEGER NOT NULL DEFAULT 5,
  min_net_kg REAL NOT NULL DEFAULT 10,         -- matches the zero_net anomaly
  max_net_kg REAL NOT NULL DEFAULT 30000,
  material TEXT NOT NULL DEFAULT 'mixed',      -- tires only; agent never asks
  vision_enabled INTEGER NOT NULL DEFAULT 0,
  vision_model TEXT NOT NULL DEFAULT 'claude-sonnet-5',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO scale_agent_settings (id) VALUES (1);

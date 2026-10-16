-- Remote control of the scale station. A screen anywhere asks the yard
-- computer (the one connected to the scale) to capture or weigh out; the yard
-- computer claims the command, does it with its own scale, camera, printer
-- and Square Terminal, and reports back. The route also creates these with
-- IF NOT EXISTS on first use, so this file is the record, not a prerequisite.
CREATE TABLE IF NOT EXISTS scale_remote_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                 -- 'capture' | 'weigh_out'
  ticket_id INTEGER,                  -- weigh_out only
  status TEXT NOT NULL DEFAULT 'pending', -- pending | claimed | done | failed | expired
  requested_by INTEGER,
  claimed_by INTEGER,
  result TEXT,                        -- JSON reported by the yard computer
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TEXT,
  done_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_scale_remote_commands_status ON scale_remote_commands(status, id);

-- Latest small camera picture from the yard computer, sent only while a
-- remote screen is watching (viewer_seen_at).
CREATE TABLE IF NOT EXISTS scale_station_view (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  image TEXT,
  image_at TEXT,
  viewer_seen_at TEXT
);
INSERT OR IGNORE INTO scale_station_view (id) VALUES (1);

-- One scale camera for everyone who opens Scale House.
--
-- WHY THIS EXISTS. The yard camera (a Reolink behind Agent DVR) is only
-- reachable from the scale-house Mac: Agent DVR and scale-bridge.js both run
-- there and both answer on loopback. Until now the camera choice was also kept
-- in that one browser's localStorage. So a different browser, a different Mac
-- login, cleared site data, or any other computer opened Scale House on the
-- laptop webcam or on nothing at all.
--
-- Two single-row tables, in the scale_bridge_state pattern (one yard):
--
--   scale_camera_config  which yard camera the scale house uses. Written by
--                        the scale-house browser whenever a yard camera goes
--                        LIVE through its bridge, so the stored value is always
--                        a setup that demonstrably worked, and a computer with
--                        no bridge cannot overwrite it. Never holds camera
--                        credentials: every Scale House user can read it.
--
--   scale_camera_frame   the latest yard-camera still, relayed. The scale-house
--                        browser posts a downscaled frame (about every 10s, or
--                        every 2s while someone is watching); any other
--                        computer shows that instead of failing to reach a
--                        localhost bridge it does not have. View only -- a
--                        relayed frame is never attached to a ticket.

CREATE TABLE IF NOT EXISTS scale_camera_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  config TEXT NOT NULL DEFAULT '{}',
  updated_by INTEGER REFERENCES employees(id),
  updated_at TEXT
);
INSERT OR IGNORE INTO scale_camera_config (id, config) VALUES (1, '{}');

CREATE TABLE IF NOT EXISTS scale_camera_frame (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  seq INTEGER NOT NULL DEFAULT 0,
  frame TEXT,
  width INTEGER,
  height INTEGER,
  weight_kg REAL,
  publisher_employee_id INTEGER REFERENCES employees(id),
  publisher_station TEXT,
  updated_at TEXT,
  viewer_seen_at TEXT
);
INSERT OR IGNORE INTO scale_camera_frame (id, seq) VALUES (1, 0);

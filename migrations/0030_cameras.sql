-- Cameras module: live views of the scale and tire-plant cameras, watchable
-- from anywhere. Browsers can't reach cameras on the yard LAN (and can't play
-- RTSP), so the always-on scale-bridge on the scale-house Mac pulls stills and
-- uploads them here while somebody is watching. See src/routes/cameras.ts.

CREATE TABLE IF NOT EXISTS cameras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,                       -- free text group: "Scale", "Processing plant"
  kind TEXT NOT NULL CHECK (kind IN ('reolink','agent_dvr','snapshot_url')),
  host TEXT,                           -- reolink: LAN IP / .local name
  port INTEGER,                        -- reolink: NULL = scheme default
  use_https INTEGER,                   -- reolink: NULL = try https then http
  channel INTEGER DEFAULT 0,           -- reolink NVR channel; 0 for a single camera
  username TEXT,
  password TEXT,                       -- never sent to a browser
  agent_dvr_oid INTEGER,
  snapshot_url TEXT,
  rotate INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_ok_at TEXT,
  last_error TEXT,
  last_checked_at TEXT,
  width INTEGER,
  height INTEGER,
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Latest picture per camera, overwritten in place.
CREATE TABLE IF NOT EXISTS camera_frames (
  camera_id INTEGER PRIMARY KEY,
  image TEXT,
  bytes INTEGER,
  captured_at TEXT
);

-- Who is watching right now. Reading a frame stamps it; the bridge only
-- uploads for cameras seen recently.
CREATE TABLE IF NOT EXISTS camera_watch (
  camera_id INTEGER PRIMARY KEY,
  seen_at TEXT,
  want_full_at TEXT
);

-- Relay heartbeat, and the Agent DVR camera list it found, for the Add form.
CREATE TABLE IF NOT EXISTS camera_station (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_seen_at TEXT,
  version TEXT,
  agentdvr_cameras TEXT
);
INSERT OR IGNORE INTO camera_station (id) VALUES (1);

INSERT INTO cameras (name, location, kind, agent_dvr_oid, sort_order)
SELECT 'Scale camera', 'Scale', 'agent_dvr', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM cameras);

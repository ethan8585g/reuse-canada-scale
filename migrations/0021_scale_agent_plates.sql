-- Plate identity for the scale agent.
--
-- Until now the agent told an arrival from a departure by weight alone. That is
-- why single_truck_mode exists: with two trucks in the yard a lighter reading is
-- ambiguous, so the loop stalls rather than risk closing the wrong ticket. A
-- plate read off the camera identifies the truck directly, so the yard can hold
-- several trucks at once and each one still closes its own ticket.
--
-- vehicle_plate already exists and is what the manual New Ticket form writes, so
-- it stays the ticket's plate and is what matching compares against. That means
-- an operator-typed plate works for matching even on a truck the camera could
-- not read -- the two paths feed one field rather than competing.

ALTER TABLE scale_tickets ADD COLUMN plate_in_confidence REAL;
ALTER TABLE scale_tickets ADD COLUMN plate_out TEXT;
ALTER TABLE scale_tickets ADD COLUMN plate_out_confidence REAL;
ALTER TABLE scale_tickets ADD COLUMN plate_source TEXT;   -- vision | operator

CREATE INDEX IF NOT EXISTS idx_scale_tickets_plate ON scale_tickets(vehicle_plate);

-- plate_matching is the master switch; with it off the agent behaves exactly as
-- it did before. plate_min_confidence is what a read must clear before it is
-- allowed to decide anything -- below it we fall back to the weight rules
-- rather than act on a guess.
ALTER TABLE scale_agent_settings ADD COLUMN plate_matching INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scale_agent_settings ADD COLUMN plate_min_confidence REAL NOT NULL DEFAULT 0.6;

ALTER TABLE scale_agent_decisions ADD COLUMN plate TEXT;
ALTER TABLE scale_agent_decisions ADD COLUMN plate_confidence REAL;

-- 0018 seeded a vision model before there was a camera to use it.
UPDATE scale_agent_settings SET vision_model = 'claude-opus-5' WHERE vision_model = 'claude-sonnet-5';

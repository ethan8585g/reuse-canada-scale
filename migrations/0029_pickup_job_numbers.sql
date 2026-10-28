-- Job numbers on pickup requests, and the load's origin frozen onto the
-- scale ticket (ARMA: every load must say exactly where it came from).

-- Job number = 1000 + id. Unique by construction, short enough to say over a
-- radio or through the scale-house window, and set by a trigger so every
-- insert path (customer portal, office booking, dashboard calendar) gets one
-- without each having to remember.
ALTER TABLE pickup_requests ADD COLUMN job_number INTEGER;
ALTER TABLE pickup_requests ADD COLUMN actual_tire_count INTEGER;
ALTER TABLE pickup_requests ADD COLUMN completed_at DATETIME;

UPDATE pickup_requests SET job_number = 1000 + id WHERE job_number IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pickup_requests_job_number ON pickup_requests(job_number);

CREATE TRIGGER IF NOT EXISTS trg_pickup_requests_job_number
AFTER INSERT ON pickup_requests
FOR EACH ROW WHEN NEW.job_number IS NULL
BEGIN
  UPDATE pickup_requests SET job_number = 1000 + NEW.id WHERE id = NEW.id;
END;

-- Origin snapshot on the ticket. Copied from the pickup + customer at the
-- moment the job is attached and never re-read: if the customer later moves
-- or changes zone, the ticket must still say where THIS load came from.
-- (scale_tickets.pickup_request_id already exists and is the live link.)
ALTER TABLE scale_tickets ADD COLUMN job_number INTEGER;
ALTER TABLE scale_tickets ADD COLUMN origin_company TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_contact TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_phone TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_address TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_city TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_province TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_postal_code TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_zone INTEGER;
ALTER TABLE scale_tickets ADD COLUMN origin_region TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_tire_type TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_tire_count INTEGER;
ALTER TABLE scale_tickets ADD COLUMN origin_tire_count_estimated INTEGER DEFAULT 0;
ALTER TABLE scale_tickets ADD COLUMN origin_collected_at TEXT;
ALTER TABLE scale_tickets ADD COLUMN origin_driver TEXT;

CREATE INDEX IF NOT EXISTS idx_scale_tickets_job_number ON scale_tickets(job_number);
CREATE INDEX IF NOT EXISTS idx_scale_tickets_origin_zone ON scale_tickets(origin_zone);

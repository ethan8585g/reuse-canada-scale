-- Zone 1A. customers.zone (0026) is INTEGER with CHECK (zone IN (1, 2, 3)),
-- and SQLite can't alter a CHECK without rebuilding the customers table, so
-- the zone moves to a text column. Code reads zone_code (aliased "zone" in
-- queries). customers.zone is still written for 1/2/3 and left NULL for 1A,
-- so nothing that reads the old column ever sees an invalid value.
ALTER TABLE customers ADD COLUMN zone_code TEXT CHECK (zone_code IN ('1', '1A', '2', '3'));
UPDATE customers SET zone_code = CAST(zone AS TEXT) WHERE zone IS NOT NULL AND zone_code IS NULL;

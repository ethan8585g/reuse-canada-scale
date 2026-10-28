-- Which tire categories a customer brings. A comma list of codes, since a
-- shop can bring more than one kind; NULL = not set yet.
--   pltt = passenger & light truck tires
--   mtt  = medium truck tires
--   otr  = off-the-road (not accepted yet; kept so customers can be tagged
--          ahead of time)
-- Validated in src/routes/employee.ts (CUSTOMER_TIRE_TYPES).

ALTER TABLE customers ADD COLUMN tire_types TEXT;

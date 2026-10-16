-- ============================================
-- 0023: DROP-OFF vs PICKUP
-- ============================================
-- The yard does two different things across one scale:
--
--   dropoff : a truck arrives loaded and tips its material. There is no bill
--             for this, so nothing goes to Square.
--   pickup  : a truck arrives empty and leaves loaded with material it is
--             buying. This is the only visit that is charged, and it is sent
--             to the Square Terminal as soon as the truck weighs out.
--
-- Until now every ticket was implicitly a drop-off AND was billed: net was
-- always weight_in - weight_out, so a pickup came out negative and priced at
-- $0 -- the exact opposite of how the yard bills. Every existing row is a
-- drop-off, which is what the default records.
ALTER TABLE scale_tickets ADD COLUMN ticket_type TEXT NOT NULL DEFAULT 'dropoff';

-- What material SELLS for, per kg, separate from price_per_kg (which was the
-- historical drop-off rate). NULL means "not set": a ticket cannot be marked a
-- pickup for a material with no pickup price, because billing it at $0 -- or
-- at a drop-off rate nobody chose for a sale -- is the silent failure this
-- column exists to prevent. Set by the scale operator from Scale House.
ALTER TABLE pricing ADD COLUMN pickup_price_per_kg REAL;

CREATE INDEX IF NOT EXISTS idx_scale_tickets_type ON scale_tickets(ticket_type);

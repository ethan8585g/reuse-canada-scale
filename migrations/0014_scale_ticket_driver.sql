-- ============================================
-- MIGRATION 0014: Driver on scale tickets
-- ============================================
-- scale_tickets.employee_id is the OPERATOR who created the ticket
-- (c.get('userId') at the scale house), not the person who drove the truck.
-- The only pre-existing driver links were via route_stops -> routes or via
-- pickup_requests, and neither is populated for walk-ins -- which are the
-- majority of tickets. So the driver is captured directly on the ticket as
-- free text: on a walk-in the driver is the customer's own, not an employee,
-- so an employees FK could not represent them.
--
-- Reads COALESCE these over the route/pickup-derived driver, so tickets that
-- do come from a scheduled pickup still resolve a driver with nothing typed.

ALTER TABLE scale_tickets ADD COLUMN driver_name TEXT;
ALTER TABLE scale_tickets ADD COLUMN driver_phone TEXT;

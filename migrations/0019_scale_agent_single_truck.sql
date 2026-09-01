-- ============================================
-- 0019: SINGLE-TRUCK MODE, STALE GUARD, 100 kg FLOOR
-- ============================================
-- Until the yard camera exists, the yard runs one truck at a time: a truck
-- weighs in, tips, and weighs out minutes later before the next arrives.
-- Under that assumption "no open ticket" means arriving and "one open ticket"
-- means leaving, which needs no vision at all.
--
-- Two guards make that assumption safe to run unattended.
--
-- single_truck_mode: with a ticket already open, a HEAVIER reading cannot be
-- the same truck weighing out. The multi-truck rule opens a second ticket,
-- which silently breaks the one-open-ticket invariant the whole scheme rests
-- on -- and the truck that leaves next then matches two candidates and
-- stalls. In single-truck mode that case goes to the operator instead.
--
-- max_open_age_hours: THE important one. If a truck weighs in and never
-- weighs out (drove off without recrossing the scale, operator error), that
-- ticket sits open forever -- and the next truck to arrive is lighter than
-- it, so the agent would close a stranger's ticket and bill the wrong
-- customer. An open ticket older than this is never auto-closed.

ALTER TABLE scale_agent_settings ADD COLUMN single_truck_mode INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scale_agent_settings ADD COLUMN max_open_age_hours REAL NOT NULL DEFAULT 12;

-- Raise the working threshold from 30 kg to 100 kg. 30 kg was low enough to
-- notice a person on the deck; 100 kg is the number the yard actually wants,
-- and no truck is anywhere near either. The vehicle floor moves with it so
-- there is one number to reason about rather than two.
--
-- Negative readings are handled in code, not here: the indicator drifts below
-- zero in wind, and a negative is never a truck. It can neither wake the
-- agent nor open or close a ticket.
UPDATE scale_agent_settings
   SET wake_threshold_kg = 100,
       vehicle_floor_kg  = 100,
       updated_at = CURRENT_TIMESTAMP
 WHERE id = 1;

-- Appearance identity + a second-pass verifier for the scale agent.
--
-- WHY THIS EXISTS. The yard camera is a wide-angle lens mounted low and to the
-- side of the deck, so a licence plate lands on roughly 70x35 pixels and reads
-- one character short (CXW9501 came back CKW9501, then CXM9501). Measured
-- against the live camera, the three things a frame reports behave very
-- differently across frames of the SAME stationary car:
--
--   body type  sedan / sedan / sedan          -- stable
--   colour     white / white / silver         -- confusable within one family
--   make+model Altima / Sentra / Sentra       -- UNSTABLE, never matched on
--
-- So appearance is stored as a small set of coarse, enumerated attributes, not
-- as the free-text description the vision call used to return. A description
-- that renames the car between frames cannot identify anything.
--
-- THE SAFETY ASYMMETRY, which is the whole design. A plate is strong evidence
-- and may both open and close tickets. Appearance is WEAK evidence and is
-- deliberately given only the two powers that cannot make the agent behave
-- worse than it does today:
--
--   1. it may VETO a close that weight alone would have made (a red dump truck
--      weighed in; a white sedan is weighing out -- stop)
--   2. it may RESOLVE a tie that weight alone has to defer on
--
-- It may never conclude "this is a new truck arriving". A no-match is exactly
-- what a noisy descriptor looks like, and opening a duplicate ticket for a
-- truck already in the yard strands the real ticket and double-counts the load.

-- Coarse attributes as JSON: {body, color, markings, confidence}. JSON rather
-- than one column per attribute because matching already happens in JS over a
-- handful of open tickets, and the attribute set will grow as the camera is
-- re-aimed. Mirrors the vehicles.specs precedent from the fleet module.
ALTER TABLE scale_tickets ADD COLUMN appearance_in TEXT;
ALTER TABLE scale_tickets ADD COLUMN appearance_out TEXT;

-- Second-pass verification. The live agent only ever sees one frame, because at
-- weigh-in the weigh-out photo does not exist yet. Once a ticket is closed both
-- photos exist and can be compared against each other, which answers the
-- question that actually decides whether the right customer was billed: is the
-- truck leaving the same truck that arrived?
ALTER TABLE scale_tickets ADD COLUMN verify_status TEXT;     -- ok | mismatch | unverifiable
ALTER TABLE scale_tickets ADD COLUMN verify_note TEXT;
ALTER TABLE scale_tickets ADD COLUMN verify_at TEXT;

-- appearance_matching is the master switch; off restores the pre-appearance
-- behaviour exactly. appearance_min_score is what a comparison must clear
-- before it is allowed to break a tie -- below it the agent defers as before.
ALTER TABLE scale_agent_settings ADD COLUMN appearance_matching INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scale_agent_settings ADD COLUMN appearance_min_score REAL NOT NULL DEFAULT 0.6;
-- Verification is a separate call on a closed ticket, so it is off the critical
-- path and safe to default on.
ALTER TABLE scale_agent_settings ADD COLUMN verify_enabled INTEGER NOT NULL DEFAULT 1;

ALTER TABLE scale_agent_decisions ADD COLUMN appearance TEXT;

-- The sweep looks for closed tickets that have both photos and no verdict yet.
CREATE INDEX IF NOT EXISTS idx_scale_tickets_verify ON scale_tickets(verify_status, status);

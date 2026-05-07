-- ============================================
-- MIGRATION 0007: Walk-In sentinel customer + dashboard index
-- ============================================
-- The Scale House print-trigger flow creates a ticket BEFORE the operator
-- knows which customer it belongs to. The previous code stored customer_id=0
-- which violated the FK to customers(id). The previous version of this
-- migration tried to rebuild scale_tickets to make customer_id nullable, but
-- a full table rebuild on a schema with 25+ ALTER-added columns is brittle.
--
-- The cleaner pattern: a sentinel "Walk-In / Unassigned" customer the
-- print-trigger and field-form use as a placeholder until the operator
-- assigns a real customer. The customer is is_active=0 so it never shows up
-- in pickers, and its password_hash is a non-verifiable token so the row
-- can never be used to log in.

INSERT OR IGNORE INTO customers (
  email, password_hash, company_name, contact_name,
  phone, address, city, province, postal_code, is_active
) VALUES (
  'walk-in@reuse-canada.local',
  '!disabled!',
  'Walk-In',
  'Unassigned',
  NULL, NULL, NULL, 'AB', NULL,
  0
);

-- Settlement and "tickets created today" filters scan by created_at descending.
-- Without this index they were doing a full table scan.
CREATE INDEX IF NOT EXISTS idx_scale_tickets_created ON scale_tickets(created_at DESC);

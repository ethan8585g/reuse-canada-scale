-- ============================================
-- MIGRATION 0009: payment_log idempotency
-- ============================================
-- A retried Square Terminal callback was inserting duplicate payment_log
-- rows. Make square_payment_id unique when present (NULL allowed, since
-- cash payments don't have one). Code paths use INSERT ... ON CONFLICT.

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_log_square_payment_id
  ON payment_log(square_payment_id)
  WHERE square_payment_id IS NOT NULL;

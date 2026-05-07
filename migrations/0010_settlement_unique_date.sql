-- ============================================
-- MIGRATION 0010: payment_batches unique batch_date
-- ============================================
-- The settlement endpoint did a non-atomic existence check before inserting
-- a new batch row, so two concurrent admins could create two batches for
-- the same date. A UNIQUE index on batch_date enforces atomicity.

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_batches_date
  ON payment_batches(batch_date);

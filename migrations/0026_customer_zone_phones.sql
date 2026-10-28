-- Customer zone (1, 2 or 3; NULL = not set yet) and multiple labelled phone
-- numbers per customer.
--
-- customers.phone is kept and always holds the FIRST number in
-- customer_phones: routes, scale tickets, receipts, the driver portal and the
-- invoice pages all read that one column, and none of them need to know a
-- customer has more than one number.

ALTER TABLE customers ADD COLUMN zone INTEGER CHECK (zone IN (1, 2, 3));

CREATE TABLE IF NOT EXISTS customer_phones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  label TEXT CHECK (label IN ('manager', 'owner', 'worker')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_phones_customer ON customer_phones(customer_id, sort_order);

-- Existing single numbers become the first (unlabelled) entry.
INSERT INTO customer_phones (customer_id, phone, label, sort_order)
SELECT c.id, TRIM(c.phone), NULL, 0
FROM customers c
WHERE c.phone IS NOT NULL AND TRIM(c.phone) != ''
  AND NOT EXISTS (SELECT 1 FROM customer_phones p WHERE p.customer_id = c.id);

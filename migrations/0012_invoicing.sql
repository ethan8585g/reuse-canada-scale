-- Invoicing module (Phase 1).
--
-- Pulls completed scale tickets into customer-level invoices. N tickets → 1
-- invoice; a ticket carries `invoice_id` once it's been billed so we can't
-- bill it twice. The operator decides per ticket whether to settle at the
-- scale (existing payment_log path) or "bill later" (left uninvoiced until
-- an invoice picks it up).
--
-- Line items snapshot pricing at the moment of invoice creation so editing
-- pricing later or reassigning the ticket doesn't retroactively change an
-- issued invoice. Customer billing details (address, company name) are NOT
-- snapshotted on the invoice header — they're joined from `customers` at
-- read time, matching how scale tickets resolve company_name today.

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,         -- INV-YYYY-NNNNN
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'draft',        -- draft | issued | void
  issued_at DATETIME,
  due_date TEXT,                               -- YYYY-MM-DD (Edmonton), nullable
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INTEGER REFERENCES employees(id),
  voided_by INTEGER REFERENCES employees(id),
  voided_at DATETIME,
  void_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  scale_ticket_id INTEGER NOT NULL REFERENCES scale_tickets(id),
  description TEXT NOT NULL,                   -- snapshot: "RC-2026-00142 — passenger tires"
  quantity REAL NOT NULL DEFAULT 0,            -- net_weight at time of invoicing
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price REAL NOT NULL DEFAULT 0,          -- snapshot of scale_tickets.price_per_kg
  line_subtotal REAL NOT NULL DEFAULT 0,       -- snapshot of total_amount
  line_tax REAL NOT NULL DEFAULT 0,            -- snapshot of tax_amount
  line_total REAL NOT NULL DEFAULT 0,          -- snapshot of grand_total
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_ticket ON invoice_line_items(scale_ticket_id);

-- One ticket can only sit on one invoice at a time. If the invoice is voided
-- we clear scale_tickets.invoice_id back to NULL (the ticket becomes billable
-- again), so this uniqueness holds across the active set.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoice_line_ticket ON invoice_line_items(scale_ticket_id);

-- Audit trail for create / issue / void operations. Mirrors scale_audit_log.
CREATE TABLE IF NOT EXISTS invoice_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  action TEXT NOT NULL,                        -- created | issued | voided | line_added | line_removed
  employee_id INTEGER REFERENCES employees(id),
  details TEXT,                                -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_invoice ON invoice_audit_log(invoice_id);

-- Back-reference on scale_tickets. NULL = uninvoiced (billable). Set when a
-- ticket is added to a line item; cleared when the invoice is voided.
ALTER TABLE scale_tickets ADD COLUMN invoice_id INTEGER REFERENCES invoices(id);

CREATE INDEX IF NOT EXISTS idx_scale_tickets_invoice ON scale_tickets(invoice_id);

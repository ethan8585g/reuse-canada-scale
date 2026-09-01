-- Shareable read-only links for scale tickets.
-- A link is an unguessable token; anyone holding it can view that one ticket
-- without signing in, which is the point (it gets texted/emailed to a customer).
-- Tokens are revocable so a mis-sent link can be killed without voiding the ticket.
CREATE TABLE IF NOT EXISTS ticket_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scale_ticket_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME,
  FOREIGN KEY (scale_ticket_id) REFERENCES scale_tickets(id),
  FOREIGN KEY (created_by) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_shares_token ON ticket_shares(token);
CREATE INDEX IF NOT EXISTS idx_ticket_shares_ticket ON ticket_shares(scale_ticket_id);

-- ============================================
-- MIGRATION 0008: login attempt tracking for brute-force protection
-- ============================================
-- Records every login attempt (success or failure) so the auth route can
-- enforce per-email and per-IP rate limits. Old rows are pruned by the
-- auth route after each successful login (best-effort, non-blocking).

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_address, created_at DESC);

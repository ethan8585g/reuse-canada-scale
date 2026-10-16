-- ============================================
-- 0024: STATION BRANDING + MATERIAL NOTES
-- ============================================
-- Branding for the Scale House station and the receipts it prints: business
-- name and two colours. One row (id = 1) because this deployment serves one
-- yard; written only by admin/manager. No logo yet -- picture uploads were
-- deferred by the owner (2026-10-16), and a logo must be stored as image data
-- with server-side validation when it lands, never as SVG/HTML.
CREATE TABLE IF NOT EXISTS station_branding (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'Reuse Canada',
  primary_color TEXT NOT NULL DEFAULT '#1f3a2f',
  accent_color TEXT NOT NULL DEFAULT '#dcf2a2',
  updated_by INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO station_branding (id) VALUES (1);

-- Free-text notes on a material (handling, grading, what counts as this
-- material). Shown to the operator next to the material; never printed.
ALTER TABLE pricing ADD COLUMN notes TEXT;

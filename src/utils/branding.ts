// Station branding: business name + two colours, one row. Used by the Scale
// House page and the receipts it prints. Validated here so the API and any
// future caller agree on what is acceptable.

export interface Branding { business_name: string; primary_color: string; accent_color: string }

export const BRANDING_DEFAULTS: Branding = {
  business_name: 'Reuse Canada', primary_color: '#1f3a2f', accent_color: '#dcf2a2',
}

const HEX = /^#[0-9a-fA-F]{6}$/

function luminance(hex: string): number {
  const ch = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// The primary colour carries white text (buttons, headers); the accent carries
// dark text (the Capture button). Both must stay readable, so 4.5:1 (WCAG AA
// for normal text) is enforced rather than left to taste.
export function validateBranding(b: any): { ok: true; value: Branding } | { ok: false; error: string } {
  const name = typeof b?.business_name === 'string' ? b.business_name.trim() : ''
  if (!name) return { ok: false, error: 'Business name is required' }
  if (name.length > 60) return { ok: false, error: 'Business name must be 60 characters or fewer' }
  const p = String(b?.primary_color || ''), a = String(b?.accent_color || '')
  if (!HEX.test(p) || !HEX.test(a)) return { ok: false, error: 'Colours must be #RRGGBB' }
  if (contrast(p, '#ffffff') < 4.5) return { ok: false, error: 'The primary colour is too light for white text on it (needs 4.5:1 contrast). Pick a darker colour.' }
  if (contrast(a, '#14241d') < 4.5) return { ok: false, error: 'The accent colour is too dark for dark text on it (needs 4.5:1 contrast). Pick a lighter colour.' }
  return { ok: true, value: { business_name: name, primary_color: p.toLowerCase(), accent_color: a.toLowerCase() } }
}

// Never throws: a missing table (migration not yet applied) or row falls back
// to the defaults, so receipts keep printing.
export async function getBranding(db: D1Database): Promise<Branding> {
  try {
    const r = await db.prepare('SELECT business_name, primary_color, accent_color FROM station_branding WHERE id = 1').first<any>()
    if (!r) return { ...BRANDING_DEFAULTS }
    return {
      business_name: r.business_name || BRANDING_DEFAULTS.business_name,
      primary_color: r.primary_color || BRANDING_DEFAULTS.primary_color,
      accent_color: r.accent_color || BRANDING_DEFAULTS.accent_color,
    }
  } catch {
    return { ...BRANDING_DEFAULTS }
  }
}

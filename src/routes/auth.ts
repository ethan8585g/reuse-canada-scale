import { Hono } from 'hono'
import { hashPassword, verifyPassword } from '../utils/passwords'

type Bindings = { DB: D1Database }

export const authRoutes = new Hono<{ Bindings: Bindings }>()

const SESSION_TTL_MS = 24 * 60 * 60 * 1000

// Rate-limit thresholds (rolling 15-minute window).
const LOGIN_WINDOW_MIN = 15
const LOGIN_MAX_FAILS_PER_EMAIL = 8
const LOGIN_MAX_FAILS_PER_IP = 30

// A pre-computed PBKDF2 hash of a random throwaway password. Used to keep
// the login latency on the "no such user" path comparable to a real verify,
// closing the email-enumeration timing oracle.
const DUMMY_HASH = 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0')
  return s
}

function getClientIp(c: any): string {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown'
}

function sessionCookie(token: string, expiresAt: Date): string {
  const exp = expiresAt.toUTCString()
  return `rc_session=${token}; Path=/; Expires=${exp}; HttpOnly; Secure; SameSite=Strict`
}

function clearSessionCookie(): string {
  return 'rc_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
}

async function recordLoginAttempt(db: D1Database, email: string, ip: string, success: boolean) {
  try {
    await db.prepare(
      'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)'
    ).bind(email.toLowerCase(), ip, success ? 1 : 0).run()
  } catch (e) { /* table may not exist on first deploy; non-fatal */ }
}

async function recentFailureCount(db: D1Database, email: string, ip: string): Promise<{ byEmail: number, byIp: number }> {
  try {
    const since = `-${LOGIN_WINDOW_MIN} minutes`
    const byEmail = await db.prepare(
      "SELECT COUNT(*) as cnt FROM login_attempts WHERE email = ? AND success = 0 AND created_at > datetime('now', ?)"
    ).bind(email.toLowerCase(), since).first()
    const byIp = await db.prepare(
      "SELECT COUNT(*) as cnt FROM login_attempts WHERE ip_address = ? AND success = 0 AND created_at > datetime('now', ?)"
    ).bind(ip, since).first()
    return { byEmail: (byEmail?.cnt as number) || 0, byIp: (byIp?.cnt as number) || 0 }
  } catch (e) { return { byEmail: 0, byIp: 0 } }
}

authRoutes.post('/login', async (c) => {
  try {
    const { email, password, user_type: requestedType } = await c.req.json()
    const ip = getClientIp(c)

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const loginVal = (email as string).trim()

    // Brute-force gate before doing any expensive work.
    const fails = await recentFailureCount(c.env.DB, loginVal, ip)
    if (fails.byEmail >= LOGIN_MAX_FAILS_PER_EMAIL || fails.byIp >= LOGIN_MAX_FAILS_PER_IP) {
      await recordLoginAttempt(c.env.DB, loginVal, ip, false)
      return c.json({ error: 'Too many failed attempts. Try again in a few minutes.' }, 429)
    }

    let user: any = null
    let resolvedType: 'employee' | 'customer' | null = null

    const tryEmployee = !requestedType || requestedType === 'employee' || requestedType === 'auto'
    const tryCustomer = !requestedType || requestedType === 'customer' || requestedType === 'auto'

    if (tryEmployee) {
      user = await c.env.DB.prepare(
        'SELECT id, email, first_name, last_name, phone, role, password_hash FROM employees WHERE LOWER(email) = LOWER(?) AND is_active = 1'
      ).bind(loginVal).first()
      if (user) resolvedType = 'employee'
    }

    if (!user && tryCustomer) {
      user = await c.env.DB.prepare(
        'SELECT id, email, company_name, contact_name, phone, address, city, province, postal_code, password_hash FROM customers WHERE LOWER(email) = LOWER(?) AND is_active = 1'
      ).bind(loginVal).first()
      if (user) resolvedType = 'customer'
    }

    // Always run a verify, even on the not-found path, so login latency does
    // not leak whether the email exists.
    const hashToCheck = user ? (user.password_hash as string | null) : DUMMY_HASH
    const verify = await verifyPassword(password, hashToCheck)

    if (!user || !resolvedType || !verify.ok) {
      await recordLoginAttempt(c.env.DB, loginVal, ip, false)
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    if (verify.needsRehash) {
      try {
        const newHash = await hashPassword(password)
        const table = resolvedType === 'employee' ? 'employees' : 'customers'
        await c.env.DB.prepare(`UPDATE ${table} SET password_hash = ? WHERE id = ?`).bind(newHash, user.id).run()
        // Revoke all other live sessions for this user when their password is upgraded.
        await c.env.DB.prepare(
          'DELETE FROM sessions WHERE user_id = ? AND user_type = ?'
        ).bind(user.id, resolvedType).run()
      } catch (e) { /* migration is best-effort; never block login */ }
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

    try {
      await c.env.DB.prepare(
        "DELETE FROM sessions WHERE user_id = ? AND user_type = ? AND expires_at < datetime('now')"
      ).bind(user.id, resolvedType).run()
    } catch (e) { /* non-critical cleanup */ }

    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, user_type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(token, user.id, resolvedType, expiresAt.toISOString()).run()

    await recordLoginAttempt(c.env.DB, loginVal, ip, true)

    c.header('Set-Cookie', sessionCookie(token, expiresAt))

    if (resolvedType === 'customer') {
      return c.json({
        token,
        user_type: 'customer',
        user_id: user.id,
        email: user.email,
        company_name: user.company_name,
        name: user.contact_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
      })
    } else {
      return c.json({
        token,
        user_type: 'employee',
        user_id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      })
    }
  } catch (err: any) {
    console.error('Login error:', err)
    return c.json({ error: 'Login failed' }, 500)
  }
})

function tokenFromRequest(c: any): string | null {
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)rc_session=([^;]+)/)
  return match ? match[1] : null
}

authRoutes.post('/logout', async (c) => {
  const token = tokenFromRequest(c)
  if (token) {
    try {
      await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run()
    } catch (e) {}
  }
  c.header('Set-Cookie', clearSessionCookie())
  return c.json({ success: true })
})

// Revoke every live session for the current user (e.g. after a suspicion of
// compromise). Requires a valid current session.
authRoutes.post('/logout-all', async (c) => {
  const token = tokenFromRequest(c)
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const session = await c.env.DB.prepare(
      "SELECT user_id, user_type FROM sessions WHERE id = ? AND expires_at > datetime('now')"
    ).bind(token).first()
    if (!session) return c.json({ error: 'Session expired' }, 401)
    await c.env.DB.prepare(
      'DELETE FROM sessions WHERE user_id = ? AND user_type = ?'
    ).bind(session.user_id, session.user_type).run()
    c.header('Set-Cookie', clearSessionCookie())
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Logout failed' }, 500)
  }
})

authRoutes.get('/verify', async (c) => {
  const token = tokenFromRequest(c)
  if (!token) return c.json({ valid: false }, 401)
  try {
    const session = await c.env.DB.prepare(
      "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"
    ).bind(token).first()
    return c.json({ valid: !!session, user_type: session?.user_type, user_id: session?.user_id })
  } catch (err) {
    return c.json({ valid: false }, 500)
  }
})

import { Hono } from 'hono'

type Bindings = { DB: D1Database }

function tokenFromRequest(c: any): string | null {
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)rc_session=([^;]+)/)
  return match ? match[1] : null
}

// Validates session token (cookie preferred, Bearer accepted) and rejects
// sessions whose underlying customer/employee row was deactivated after
// the session was issued.
export async function authMiddleware(c: any, next: any) {
  const token = tokenFromRequest(c)
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const session = await c.env.DB.prepare(
      `SELECT s.id, s.user_id, s.user_type, s.expires_at,
              CASE WHEN s.user_type = 'customer' THEN c.company_name
                   ELSE e.first_name || ' ' || e.last_name END as name,
              CASE WHEN s.user_type = 'customer' THEN c.is_active
                   ELSE e.is_active END as is_active
       FROM sessions s
       LEFT JOIN customers c ON s.user_type = 'customer' AND s.user_id = c.id
       LEFT JOIN employees e ON s.user_type = 'employee' AND s.user_id = e.id
       WHERE s.id = ? AND s.expires_at > datetime('now')`
    ).bind(token).first()

    if (!session) {
      return c.json({ error: 'Session expired' }, 401)
    }
    if (session.is_active !== 1) {
      // User was deactivated. Kill the session row so the cookie can't be reused.
      try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run() } catch (e) {}
      return c.json({ error: 'Account is inactive' }, 401)
    }

    c.set('session', session)
    c.set('userId', session.user_id)
    c.set('userType', session.user_type)
    await next()
  } catch (err) {
    return c.json({ error: 'Auth error' }, 500)
  }
}

// Employee-only middleware
export async function employeeOnly(c: any, next: any) {
  if (c.get('userType') !== 'employee') {
    return c.json({ error: 'Employee access required' }, 403)
  }
  await next()
}

// Customer-only middleware
export async function customerOnly(c: any, next: any) {
  if (c.get('userType') !== 'customer') {
    return c.json({ error: 'Customer access required' }, 403)
  }
  await next()
}

// Role-based access middleware — pass allowed roles
export function roleRequired(...roles: string[]) {
  return async (c: any, next: any) => {
    const userId = c.get('userId')
    const userType = c.get('userType')
    if (userType !== 'employee') {
      return c.json({ error: 'Employee access required' }, 403)
    }
    try {
      const employee = await c.env.DB.prepare(
        'SELECT role FROM employees WHERE id = ? AND is_active = 1'
      ).bind(userId).first()
      if (!employee || !roles.includes(employee.role as string)) {
        return c.json({ error: 'Insufficient permissions' }, 403)
      }
      c.set('userRole', employee.role)
      await next()
    } catch (err) {
      return c.json({ error: 'Permission check failed' }, 500)
    }
  }
}

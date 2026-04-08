import { Hono } from 'hono'

type Bindings = { DB: D1Database }

// Simple auth middleware - validates session token
export async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.replace('Bearer ', '')
  
  try {
    const session = await c.env.DB.prepare(
      'SELECT s.*, CASE WHEN s.user_type = "customer" THEN c.company_name ELSE e.first_name || " " || e.last_name END as name FROM sessions s LEFT JOIN customers c ON s.user_type = "customer" AND s.user_id = c.id LEFT JOIN employees e ON s.user_type = "employee" AND s.user_id = e.id WHERE s.id = ? AND s.expires_at > datetime("now")'
    ).bind(token).first()
    
    if (!session) {
      return c.json({ error: 'Session expired' }, 401)
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
        'SELECT role FROM employees WHERE id = ?'
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

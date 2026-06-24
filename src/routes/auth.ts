import { Hono } from 'hono'
import type { Bindings } from '../index'

const auth = new Hono<{ Bindings: Bindings }>()

// Simple hash function (using Web Crypto API - works in Cloudflare Workers)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'ai_studio_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function generateToken(userId: string, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret || 'fallback_secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return `${data}.${sigB64}`
}

export async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp < Date.now()) return null
    return payload.sub
  } catch {
    return null
  }
}

function generateId(): string {
  return crypto.randomUUID()
}

// Register
auth.post('/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json()
    
    if (!name || !email || !password) {
      return c.json({ error: 'Name, email, and password are required' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400)
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email address' }, 400)
    }
    
    // Check if user exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first()
    if (existing) {
      return c.json({ error: 'Email already registered' }, 409)
    }
    
    const id = generateId()
    const passwordHash = await hashPassword(password)
    
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).bind(id, email.toLowerCase(), name.trim(), passwordHash).run()
    
    const token = await generateToken(id, c.env.JWT_SECRET || 'default_secret')
    
    // Create session
    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, id, expiresAt).run()
    
    return c.json({
      token,
      user: { id, name: name.trim(), email: email.toLowerCase() }
    })
  } catch (err: any) {
    console.error('Register error:', err)
    return c.json({ error: 'Registration failed: ' + err.message }, 500)
  }
})

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, password_hash FROM users WHERE email = ? AND is_active = 1'
    ).bind(email.toLowerCase()).first() as any
    
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    const passwordHash = await hashPassword(password)
    if (passwordHash !== user.password_hash) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    const token = await generateToken(user.id, c.env.JWT_SECRET || 'default_secret')
    
    return c.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return c.json({ error: 'Login failed: ' + err.message }, 500)
  }
})

// Get usage
auth.get('/usage', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const userId = await verifyToken(token, c.env.JWT_SECRET || 'default_secret')
    if (!userId) return c.json({ error: 'Invalid token' }, 401)
    
    const today = new Date().toISOString().split('T')[0]
    const rateLimit = await c.env.DB.prepare(
      'SELECT count FROM rate_limits WHERE user_id = ? AND generation_date = ?'
    ).bind(userId, today).first() as any
    
    const user = await c.env.DB.prepare(
      'SELECT daily_limit FROM users WHERE id = ?'
    ).bind(userId).first() as any
    
    return c.json({
      used: rateLimit?.count || 0,
      limit: user?.daily_limit || 20,
      remaining: (user?.daily_limit || 20) - (rateLimit?.count || 0)
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export { auth as authRoutes }

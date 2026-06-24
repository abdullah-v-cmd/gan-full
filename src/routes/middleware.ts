import type { Context } from 'hono'
import type { Bindings } from '../index'
import { verifyToken } from './auth'

export async function authenticate(c: Context<{ Bindings: Bindings }>): Promise<string | null> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  return await verifyToken(token, c.env.JWT_SECRET || 'default_secret')
}

export async function checkRateLimit(c: Context<{ Bindings: Bindings }>, userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0]
  
  // Get user's daily limit
  const user = await c.env.DB.prepare('SELECT daily_limit FROM users WHERE id = ?').bind(userId).first() as any
  const limit = user?.daily_limit || 20
  
  // Get current usage
  const existing = await c.env.DB.prepare(
    'SELECT count FROM rate_limits WHERE user_id = ? AND generation_date = ?'
  ).bind(userId, today).first() as any
  
  const currentCount = existing?.count || 0
  
  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 }
  }
  
  // Increment counter
  if (existing) {
    await c.env.DB.prepare(
      'UPDATE rate_limits SET count = count + 1 WHERE user_id = ? AND generation_date = ?'
    ).bind(userId, today).run()
  } else {
    const id = crypto.randomUUID()
    await c.env.DB.prepare(
      'INSERT INTO rate_limits (id, user_id, generation_date, count) VALUES (?, ?, ?, 1)'
    ).bind(id, userId, today).run()
  }
  
  return { allowed: true, remaining: limit - currentCount - 1 }
}

// Content safety filter
const BLOCKED_PATTERNS = [
  // Real people
  /\b(president|celebrity|actor|actress|politician|trump|biden|obama|putin|elon musk|taylor swift|beyoncé|kanye)\b/i,
  // CSAM / minors
  /\b(child|minor|underage|teen|teenager|kid|baby|infant|toddler|loli|shota)\b.*\b(nude|naked|sex|sexy|explicit|intimate|adult)\b/i,
  /\b(nude|naked|sex|sexy|explicit|intimate|adult)\b.*\b(child|minor|underage|teen|teenager|kid|baby|infant|toddler)\b/i,
  // Explicit content
  /\b(porn|pornographic|hentai|nsfw|xxx|explicit sex|sexual intercourse|rape|assault)\b/i,
  // Violence
  /\b(gore|beheading|torture|murder|execution|suicide|self-harm|mass shooting|terrorist)\b/i,
  // Real people non-consensual
  /deepfake/i,
]

export function checkContentSafety(prompt: string): { safe: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase()
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lowerPrompt)) {
      return { 
        safe: false, 
        reason: 'Your prompt contains content that violates our Terms of Service. Please avoid: real/identifiable people without consent, minors in inappropriate contexts, explicit sexual content, graphic violence, or non-consensual imagery.'
      }
    }
  }
  
  return { safe: true }
}

export async function saveGeneration(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  type: 'image' | 'audio' | 'text',
  prompt: string,
  options: {
    resultUrl?: string
    resultText?: string
    model?: string
    metadata?: any
  }
): Promise<string> {
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO generations (id, user_id, type, prompt, result_url, result_text, model, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, userId, type, prompt,
    options.resultUrl || null,
    options.resultText || null,
    options.model || null,
    'completed',
    options.metadata ? JSON.stringify(options.metadata) : null
  ).run()
  
  return id
}

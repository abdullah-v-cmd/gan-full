import { Hono } from 'hono'
import type { Bindings } from '../index'
import { authenticate } from './middleware'

const gallery = new Hono<{ Bindings: Bindings }>()

// Get all generations for the current user
gallery.get('/', async (c) => {
  const userId = await authenticate(c)
  if (!userId) return c.json({ error: 'Authentication required' }, 401)
  
  const type = c.req.query('type')
  const page = parseInt(c.req.query('page') || '1')
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
  const offset = (page - 1) * limit
  
  try {
    let query = 'SELECT id, type, prompt, result_url, result_text, model, status, metadata, created_at FROM generations WHERE user_id = ?'
    const params: any[] = [userId]
    
    if (type && ['image', 'audio', 'text'].includes(type)) {
      query += ' AND type = ?'
      params.push(type)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const results = await c.env.DB.prepare(query).bind(...params).all()
    
    // Count total
    let countQuery = 'SELECT COUNT(*) as count FROM generations WHERE user_id = ?'
    const countParams: any[] = [userId]
    if (type && ['image', 'audio', 'text'].includes(type)) {
      countQuery += ' AND type = ?'
      countParams.push(type)
    }
    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first() as any
    
    return c.json({
      generations: results.results || [],
      total: totalResult?.count || 0,
      page,
      limit,
    })
  } catch (err: any) {
    console.error('Gallery fetch error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// Delete a generation
gallery.delete('/:id', async (c) => {
  const userId = await authenticate(c)
  if (!userId) return c.json({ error: 'Authentication required' }, 401)
  
  const id = c.req.param('id')
  
  try {
    // Verify ownership
    const gen = await c.env.DB.prepare(
      'SELECT id FROM generations WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first()
    
    if (!gen) {
      return c.json({ error: 'Generation not found or access denied' }, 404)
    }
    
    await c.env.DB.prepare('DELETE FROM generations WHERE id = ?').bind(id).run()
    
    return c.json({ success: true, message: 'Generation deleted' })
  } catch (err: any) {
    console.error('Delete error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// Get stats
gallery.get('/stats', async (c) => {
  const userId = await authenticate(c)
  if (!userId) return c.json({ error: 'Authentication required' }, 401)
  
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        type,
        COUNT(*) as count,
        MAX(created_at) as last_generated
      FROM generations 
      WHERE user_id = ?
      GROUP BY type
    `).bind(userId).all()
    
    const today = new Date().toISOString().split('T')[0]
    const todayCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM generations 
      WHERE user_id = ? AND date(created_at) = ?
    `).bind(userId, today).first() as any
    
    return c.json({
      byType: stats.results,
      todayCount: todayCount?.count || 0,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export { gallery as galleryRoutes }

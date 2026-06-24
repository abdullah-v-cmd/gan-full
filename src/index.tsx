import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { authRoutes } from './routes/auth'
import { imageRoutes } from './routes/image'
import { audioRoutes } from './routes/audio'
import { textRoutes } from './routes/text'
import { galleryRoutes } from './routes/gallery'
import { renderPage } from './renderer'

export type Bindings = {
  DB: D1Database
  HF_API_TOKEN: string
  GROQ_API_KEY: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Static files
app.use('/static/*', serveStatic({ root: './' }))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/image', imageRoutes)
app.route('/api/audio', audioRoutes)
app.route('/api/text', textRoutes)
app.route('/api/gallery', galleryRoutes)

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Serve the SPA for all other routes
app.get('*', (c) => {
  return c.html(renderPage())
})

export default app

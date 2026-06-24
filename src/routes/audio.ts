import { Hono } from 'hono'
import type { Bindings } from '../index'
import { authenticate, checkRateLimit, checkContentSafety, saveGeneration } from './middleware'

const audio = new Hono<{ Bindings: Bindings }>()

// HuggingFace TTS models (free tier)
const TTS_MODELS = {
  default: 'espnet/kan-bayashi_ljspeech_vits',
  male: 'facebook/mms-tts-eng',
  female: 'espnet/kan-bayashi_ljspeech_vits',
}

async function generateTTS(
  token: string,
  text: string,
  model: string
): Promise<ArrayBuffer | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)
  
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true',
        },
        body: JSON.stringify({ inputs: text }),
        signal: controller.signal,
      }
    )
    
    clearTimeout(timeout)
    
    if (response.status === 503) {
      return null // Model loading
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`TTS API error ${response.status}:`, errorText)
      throw new Error(`TTS model error: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('audio') && !contentType.includes('flac') && !contentType.includes('wav') && !contentType.includes('octet')) {
      const text2 = await response.text()
      console.error('Non-audio response:', text2.substring(0, 200))
      throw new Error('Model returned non-audio response')
    }
    
    return await response.arrayBuffer()
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. TTS model may need warm-up. Please try again in 20s.')
    }
    if (err.message?.includes('DNS') || err.message?.includes('internal error') || err.message?.includes('fetch failed')) {
      throw new Error('TTS API temporarily unavailable. Please try again in a moment.')
    }
    throw err
  }
}

audio.post('/generate', async (c) => {
  const userId = await authenticate(c)
  if (!userId) return c.json({ error: 'Authentication required' }, 401)
  
  const { allowed, remaining } = await checkRateLimit(c, userId)
  if (!allowed) {
    return c.json({ error: 'Daily generation limit reached (20/day). Try again tomorrow!' }, 429)
  }
  
  const { text, voice = 'default' } = await c.req.json()
  
  if (!text || typeof text !== 'string') {
    return c.json({ error: 'Text is required' }, 400)
  }
  
  if (text.length > 500) {
    return c.json({ error: 'Text too long (max 500 characters for free tier)' }, 400)
  }
  
  // Safety check
  const safety = checkContentSafety(text)
  if (!safety.safe) {
    return c.json({ error: safety.reason }, 400)
  }
  
  const token = c.env.HF_API_TOKEN
  if (!token) {
    return c.json({ error: 'HuggingFace API token not configured' }, 500)
  }
  
  const modelKey = voice as keyof typeof TTS_MODELS
  const model = TTS_MODELS[modelKey] || TTS_MODELS.default
  
  try {
    let audioData = await generateTTS(token, text, model)
    
    if (!audioData) {
      // Try fallback model
      audioData = await generateTTS(token, text, TTS_MODELS.default)
      
      if (!audioData) {
        return c.json({
          error: 'TTS model is warming up. Please try again in 20 seconds. Free-tier models have cold-start delays.',
          retryAfter: 20
        }, 503)
      }
    }
    
    // Convert to base64 data URL
    const base64 = btoa(String.fromCharCode(...new Uint8Array(audioData)))
    const dataUrl = `data:audio/wav;base64,${base64}`
    
    const filename = `speech-${Date.now()}.wav`
    
    const genId = await saveGeneration(c, userId, 'audio', text, {
      resultUrl: dataUrl,
      model: model,
      metadata: { voice, filename }
    })
    
    return c.json({
      url: dataUrl,
      filename,
      model,
      id: genId,
      remaining,
      note: 'Audio generated using free-tier HuggingFace TTS. Quality limited compared to paid services.'
    })
  } catch (err: any) {
    console.error('Audio generation error:', err)
    return c.json({ 
      error: err.message || 'Audio generation failed. Please try again.',
      retryAfter: 20
    }, 500)
  }
})

// Test endpoint
audio.get('/test', async (c) => {
  const token = c.env.HF_API_TOKEN
  if (!token) return c.json({ status: 'error', message: 'No HF token configured' })
  
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${TTS_MODELS.default}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: 'Hello, this is a test.' })
    })
    
    const contentType = response.headers.get('content-type') || ''
    
    return c.json({
      status: response.ok || response.status === 503 ? 'ok' : 'error',
      httpStatus: response.status,
      contentType,
      message: response.status === 503 
        ? 'Model loading (warm-up in progress, normal for free tier)' 
        : response.ok ? 'TTS API connected successfully' : `HTTP ${response.status}`,
      model: TTS_MODELS.default
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message })
  }
})

export { audio as audioRoutes }

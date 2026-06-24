import { Hono } from 'hono'
import type { Bindings } from '../index'
import { authenticate, checkRateLimit, checkContentSafety, saveGeneration } from './middleware'

const image = new Hono<{ Bindings: Bindings }>()

const HF_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'stabilityai/stable-diffusion-3.5-large-turbo',
  'stabilityai/stable-diffusion-xl-base-1.0',
]

async function generateWithHuggingFace(
  token: string,
  prompt: string,
  model: string = HF_IMAGE_MODELS[0]
): Promise<ArrayBuffer | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout
  
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
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            guidance_scale: 3.5,
            num_inference_steps: 4,
          }
        }),
        signal: controller.signal,
      }
    )
    
    clearTimeout(timeout)
    
    if (response.status === 503) {
      // Model loading
      return null
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HF API error ${response.status}:`, errorText)
      throw new Error(`Model API error: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('image')) {
      const text = await response.text()
      console.error('Non-image response:', text)
      throw new Error('Model returned non-image response')
    }
    
    return await response.arrayBuffer()
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Free-tier models can be slow. Please try again.')
    }
    throw err
  }
}

image.post('/generate', async (c) => {
  const userId = await authenticate(c)
  if (!userId) return c.json({ error: 'Authentication required' }, 401)
  
  const { allowed, remaining } = await checkRateLimit(c, userId)
  if (!allowed) {
    return c.json({ error: 'Daily generation limit reached (20/day). Try again tomorrow!' }, 429)
  }
  
  const { prompt, style = 'photorealistic', variants = 2 } = await c.req.json()
  
  if (!prompt || typeof prompt !== 'string') {
    return c.json({ error: 'Prompt is required' }, 400)
  }
  
  if (prompt.length > 500) {
    return c.json({ error: 'Prompt too long (max 500 characters)' }, 400)
  }
  
  // Safety check
  const safety = checkContentSafety(prompt)
  if (!safety.safe) {
    return c.json({ error: safety.reason }, 400)
  }
  
  const numVariants = Math.min(Math.max(1, parseInt(String(variants))), 4)
  const enhancedPrompt = `${prompt}, ${style}, high quality, detailed`
  
  const token = c.env.HF_API_TOKEN
  if (!token) {
    return c.json({ error: 'HuggingFace API token not configured' }, 500)
  }
  
  const results: Array<{ url: string; id: string }> = []
  const errors: string[] = []
  
  // Generate variants (with slight prompt variations)
  const promptVariations = [
    enhancedPrompt,
    `${enhancedPrompt}, cinematic lighting`,
    `${enhancedPrompt}, dramatic composition`,
    `${enhancedPrompt}, vibrant colors, sharp focus`,
  ]
  
  for (let i = 0; i < numVariants; i++) {
    try {
      const imageData = await generateWithHuggingFace(
        token,
        promptVariations[i] || enhancedPrompt,
        HF_IMAGE_MODELS[0]
      )
      
      if (!imageData) {
        // Try fallback model
        const fallbackData = await generateWithHuggingFace(
          token,
          promptVariations[i] || enhancedPrompt,
          HF_IMAGE_MODELS[2] // SDXL as fallback
        )
        
        if (!fallbackData) {
          errors.push(`Variant ${i+1}: Model warming up, please retry in 20s`)
          continue
        }
        
        // Store in R2 or convert to base64 data URL
        const base64 = btoa(String.fromCharCode(...new Uint8Array(fallbackData)))
        const dataUrl = `data:image/jpeg;base64,${base64}`
        
        const genId = await saveGeneration(c, userId, 'image', prompt, {
          resultUrl: dataUrl,
          model: HF_IMAGE_MODELS[2],
          metadata: { style, variant: i + 1 }
        })
        
        results.push({ url: dataUrl, id: genId })
      } else {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData)))
        const dataUrl = `data:image/jpeg;base64,${base64}`
        
        const genId = await saveGeneration(c, userId, 'image', prompt, {
          resultUrl: dataUrl,
          model: HF_IMAGE_MODELS[0],
          metadata: { style, variant: i + 1 }
        })
        
        results.push({ url: dataUrl, id: genId })
      }
    } catch (err: any) {
      console.error(`Variant ${i+1} error:`, err)
      errors.push(`Variant ${i+1}: ${err.message}`)
    }
  }
  
  if (results.length === 0) {
    const errorMsg = errors.length > 0 
      ? `Generation failed: ${errors[0]}. Free-tier models may need warm-up (20-60s). Please try again.`
      : 'Image generation failed. Please try again.'
    return c.json({ error: errorMsg }, 500)
  }
  
  return c.json({
    images: results,
    model: HF_IMAGE_MODELS[0],
    warnings: errors.length > 0 ? errors : undefined,
    remaining
  })
})

// Test endpoint
image.get('/test', async (c) => {
  const token = c.env.HF_API_TOKEN
  if (!token) return c.json({ status: 'error', message: 'No HF token configured' })
  
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: 'a red circle', parameters: { num_inference_steps: 1 } })
    })
    
    const contentType = response.headers.get('content-type') || ''
    
    return c.json({
      status: response.ok ? 'ok' : 'error',
      httpStatus: response.status,
      contentType,
      message: response.ok ? 'HuggingFace API connected successfully' : `HTTP ${response.status}`,
      model: 'FLUX.1-schnell'
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message })
  }
})

export { image as imageRoutes }

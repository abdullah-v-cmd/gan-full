import { Hono } from 'hono'
import type { Bindings } from '../index'
import { authenticate, checkRateLimit, checkContentSafety, saveGeneration } from './middleware'

const text = new Hono<{ Bindings: Bindings }>()

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const LENGTH_TOKENS = {
  short: 300,
  medium: 700,
  long: 1500,
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: 'Write in a professional, clear, and authoritative tone suitable for business contexts.',
  casual: 'Write in a friendly, conversational, and approachable tone.',
  creative: 'Write in a creative, imaginative, and engaging tone with vivid descriptions.',
  academic: 'Write in an academic, scholarly tone with precise language and structured arguments.',
  humorous: 'Write in a light-hearted, witty, and humorous tone that entertains the reader.',
  persuasive: 'Write in a compelling, persuasive tone that convinces the reader.',
}

async function callGroqAPI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
        top_p: 0.95,
        stream: false,
      }),
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      const errorData = await response.json() as any
      if (response.status === 429) {
        throw new Error('Groq rate limit reached. Please wait a moment and try again.')
      }
      if (response.status === 401) {
        throw new Error('Groq API authentication failed. Please check your API key.')
      }
      throw new Error(errorData?.error?.message || `Groq API error: ${response.status}`)
    }
    
    const data = await response.json() as any
    return data.choices?.[0]?.message?.content || ''
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Text generation timed out. Please try again.')
    }
    throw err
  }
}

text.post('/generate', async (c) => {
  const userId = await authenticate(c)
  if (!userId) return c.json({ error: 'Authentication required' }, 401)
  
  const { allowed, remaining } = await checkRateLimit(c, userId)
  if (!allowed) {
    return c.json({ error: 'Daily generation limit reached (20/day). Try again tomorrow!' }, 429)
  }
  
  const { prompt, tone = 'professional', contentType = 'blog post', length = 'medium' } = await c.req.json()
  
  if (!prompt || typeof prompt !== 'string') {
    return c.json({ error: 'Prompt is required' }, 400)
  }
  
  if (prompt.length > 1000) {
    return c.json({ error: 'Prompt too long (max 1000 characters)' }, 400)
  }
  
  // Safety check
  const safety = checkContentSafety(prompt)
  if (!safety.safe) {
    return c.json({ error: safety.reason }, 400)
  }
  
  const apiKey = c.env.GROQ_API_KEY
  if (!apiKey) {
    return c.json({ error: 'Groq API key not configured' }, 500)
  }
  
  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional
  const maxTokens = LENGTH_TOKENS[length as keyof typeof LENGTH_TOKENS] || LENGTH_TOKENS.medium
  
  const systemPrompt = `You are an expert content writer and creative assistant. ${toneInstruction}

Important guidelines:
- Generate high-quality, original content
- Do not include harmful, misleading, or inappropriate content  
- Format the content appropriately for the requested type
- Be thorough but concise based on the requested length
- Add a subtle note at the end: "[AI-Generated Content via AI Studio]"`
  
  const userPrompt = `Write a ${length} ${contentType} about: ${prompt}

Requirements:
- Tone: ${tone}
- Type: ${contentType}
- Make it engaging and well-structured`
  
  try {
    const generatedText = await callGroqAPI(apiKey, systemPrompt, userPrompt, maxTokens)
    
    if (!generatedText) {
      return c.json({ error: 'No content generated. Please try again.' }, 500)
    }
    
    const genId = await saveGeneration(c, userId, 'text', prompt, {
      resultText: generatedText,
      model: GROQ_MODEL,
      metadata: { tone, contentType, length }
    })
    
    return c.json({
      text: generatedText,
      model: GROQ_MODEL,
      id: genId,
      remaining,
      wordCount: generatedText.split(/\s+/).length
    })
  } catch (err: any) {
    console.error('Text generation error:', err)
    return c.json({ error: err.message || 'Text generation failed' }, 500)
  }
})

// Test endpoint
text.get('/test', async (c) => {
  const apiKey = c.env.GROQ_API_KEY
  if (!apiKey) return c.json({ status: 'error', message: 'No Groq API key configured' })
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    
    if (!response.ok) {
      return c.json({ status: 'error', httpStatus: response.status, message: `HTTP ${response.status}` })
    }
    
    const data = await response.json() as any
    const models = data.data?.map((m: any) => m.id) || []
    const hasLlama = models.some((m: string) => m.includes('llama'))
    
    return c.json({
      status: 'ok',
      message: 'Groq API connected successfully',
      model: GROQ_MODEL,
      availableModels: models.slice(0, 5),
      llamaAvailable: hasLlama
    })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message })
  }
})

export { text as textRoutes }

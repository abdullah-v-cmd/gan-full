# 🎨 AI Studio — Multi-Modal AI Content Generation Platform

A free-tier AI content generation platform for images, audio, and text.

## 🚀 Features

### Image Generation
- **Model**: FLUX.1-schnell (primary), SDXL (fallback) via Hugging Face
- Generate up to 4 variants per prompt
- 6 style presets (Photorealistic, Digital Art, Painting, Anime, Cyberpunk, Watercolor)
- Free tier: ~50 requests/day shared

### Audio/TTS Generation  
- **Model**: espnet/kan-bayashi_ljspeech_vits + facebook/mms-tts-eng via Hugging Face
- Text-to-speech (max 500 chars on free tier)
- Multiple voice styles
- ⚠️ Quality limited vs. paid (ElevenLabs, Google TTS)

### Text Generation
- **Model**: llama-3.3-70b-versatile via Groq
- Long-form writing assistant
- Tone/style controls (Professional, Casual, Creative, Academic, Humorous, Persuasive)
- Content types: Blog, Essay, Story, Email, Social, Poem, Script
- ⚡ Blazing fast (Groq's LPU inference)

## 🔑 APIs Used

| Service | Free Tier Limits | Upgrade Path |
|---------|-----------------|--------------|
| Hugging Face Inference API | ~50 requests/day, cold starts | HF Pro $9/mo |
| Groq API | 14,400 tokens/min free | Groq paid tiers |

## 🛡️ Trust & Safety

- All generated content watermarked as "🤖 AI-Generated"
- Prompt safety filtering (blocks CSAM, violence, real people without consent)
- Per-user daily limit: 20 generations/day
- Terms of Service visible on registration

## 🏗️ Architecture

- **Frontend**: Pure HTML/CSS/JS with Tailwind CDN (no build step for frontend)
- **Backend**: Hono.js on Cloudflare Workers (edge runtime)
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Pages (free tier)

## 🚀 Deployment

```bash
# Install deps
npm install

# Local development
npm run build
npm run dev:sandbox

# Deploy
npm run deploy
```

## ⚙️ Environment Variables

```
HF_API_TOKEN=your_huggingface_token
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
```

## 📝 Known Free-Tier Limitations

1. **Image generation**: 20-60s warm-up on cold start ("Model loading")
2. **Audio quality**: Basic TTS, not production quality
3. **Rate limits**: 20 generations/user/day to preserve shared quota
4. **Image size**: Models may return 512x512 or 768x768 max
5. **No video**: Requires paid GPU compute

## 🔄 Upgrading to Paid Tiers

- **Better images**: HF Pro ($9/mo) or Replicate ($0.003/image)
- **Better audio**: ElevenLabs ($5/mo) or Google TTS
- **More text**: Groq paid or OpenAI GPT-4
- **Video**: Stable Video Diffusion via Replicate (~$0.05/clip)

export function renderPage(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Studio — Multi-Modal Content Generation</title>
  <meta name="description" content="Free-tier AI content generation platform for images, audio, and text using Hugging Face and Groq APIs." />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#f0f0ff',
              100: '#e0e0ff',
              200: '#c4c4ff',
              300: '#a0a0ff',
              400: '#8080ff',
              500: '#6366f1',
              600: '#4f46e5',
              700: '#4338ca',
              800: '#3730a3',
              900: '#312e81',
            }
          },
          animation: {
            'spin-slow': 'spin 3s linear infinite',
            'pulse-fast': 'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite',
            'gradient': 'gradient 6s ease infinite',
          },
          keyframes: {
            gradient: {
              '0%, 100%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
            }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
  <style>
    body { background: #0f0f1a; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; }
    .gradient-text { background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card-glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 25px rgba(99,102,241,0.4); }
    .tab-active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    .spinner { border: 3px solid rgba(99,102,241,0.3); border-top-color: #6366f1; border-radius: 50%; width: 24px; height: 24px; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .watermark { position: relative; }
    .watermark::after { content: '🤖 AI-Generated'; position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; pointer-events: none; }
    .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; padding: 1rem 1.5rem; border-radius: 0.75rem; max-width: 400px; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1a1a2e; } ::-webkit-scrollbar-thumb { background: #4338ca; border-radius: 3px; }
    .nav-link { transition: all 0.2s; } .nav-link:hover { color: #818cf8; }
    .generation-card { transition: transform 0.2s, box-shadow 0.2s; } .generation-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .progress-bar { height: 4px; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 2px; animation: progress 2s ease-in-out infinite; }
    @keyframes progress { 0% { width: 10%; } 50% { width: 70%; } 100% { width: 10%; } }
    .input-field { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; transition: border-color 0.2s; }
    .input-field:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body class="min-h-screen">

<!-- App Root -->
<div id="app">
  <!-- Auth Screen -->
  <div id="auth-screen" class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">🎨</div>
        <h1 class="text-4xl font-bold gradient-text mb-2">AI Studio</h1>
        <p class="text-gray-400">Multi-Modal AI Content Generation Platform</p>
        <div class="flex items-center justify-center gap-2 mt-3">
          <span class="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">✓ Free Tier</span>
          <span class="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">Hugging Face</span>
          <span class="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">Groq</span>
        </div>
      </div>
      
      <div class="card-glass rounded-2xl p-8">
        <div class="flex gap-2 mb-6">
          <button onclick="showTab('login')" id="tab-login" class="flex-1 py-2 rounded-lg font-medium text-sm tab-active" >Sign In</button>
          <button onclick="showTab('register')" id="tab-register" class="flex-1 py-2 rounded-lg font-medium text-sm text-gray-400 hover:text-white transition-colors">Create Account</button>
        </div>
        
        <!-- Login Form -->
        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" id="login-email" required placeholder="you@example.com" class="input-field w-full px-4 py-3 rounded-xl" />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" id="login-password" required placeholder="••••••••" class="input-field w-full px-4 py-3 rounded-xl" />
            </div>
            <button type="submit" id="login-btn" class="btn-primary w-full py-3 rounded-xl font-semibold text-white">
              <span id="login-text">Sign In</span>
              <span id="login-spinner" class="hidden"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span></span>
            </button>
          </div>
        </form>
        
        <!-- Register Form -->
        <form id="register-form" class="hidden" onsubmit="handleRegister(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Full Name</label>
              <input type="text" id="reg-name" required placeholder="John Doe" class="input-field w-full px-4 py-3 rounded-xl" />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" id="reg-email" required placeholder="you@example.com" class="input-field w-full px-4 py-3 rounded-xl" />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" id="reg-password" required placeholder="••••••••" minlength="6" class="input-field w-full px-4 py-3 rounded-xl" />
            </div>
            <div class="text-xs text-gray-500 bg-gray-800/50 rounded-lg p-3">
              By registering, you agree to our <a href="#tos" onclick="showTOS()" class="text-primary-400 hover:underline">Terms of Service</a>. Daily limit: 20 free generations.
            </div>
            <button type="submit" id="register-btn" class="btn-primary w-full py-3 rounded-xl font-semibold text-white">
              <span id="register-text">Create Account</span>
              <span id="register-spinner" class="hidden"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span></span>
            </button>
          </div>
        </form>
        
        <p class="text-center text-xs text-gray-500 mt-4">
          🔒 Secure · 🌍 Free Tier · ⚡ Powered by HuggingFace & Groq
        </p>
      </div>
    </div>
  </div>
  
  <!-- Main App (hidden until logged in) -->
  <div id="main-app" class="hidden min-h-screen">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 card-glass border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🎨</span>
          <span class="text-xl font-bold gradient-text">AI Studio</span>
          <span class="hidden sm:block text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Free Tier</span>
        </div>
        
        <div class="flex items-center gap-2">
          <div class="hidden md:flex gap-1">
            <button onclick="showSection('generate')" class="nav-link px-3 py-1.5 rounded-lg text-sm" id="nav-generate">Generate</button>
            <button onclick="showSection('gallery')" class="nav-link px-3 py-1.5 rounded-lg text-sm" id="nav-gallery">Gallery</button>
          </div>
          
          <div class="flex items-center gap-2 ml-2">
            <div class="text-right hidden sm:block">
              <div class="text-xs text-gray-400">Daily Usage</div>
              <div class="text-xs font-medium" id="usage-display">0/20</div>
            </div>
            <div class="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-sm font-bold" id="user-avatar">U</div>
            <button onclick="handleLogout()" class="text-gray-400 hover:text-red-400 transition-colors ml-1" title="Sign Out">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Generate Section -->
    <div id="section-generate" class="max-w-7xl mx-auto px-4 py-8">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold text-white mb-2">Create with AI</h2>
        <p class="text-gray-400">Powered by Hugging Face & Groq free-tier APIs</p>
      </div>
      
      <!-- Generation Type Tabs -->
      <div class="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl max-w-lg mx-auto">
        <button onclick="switchMode('image')" id="mode-image" class="flex-1 py-2.5 rounded-xl font-medium text-sm tab-active flex items-center justify-center gap-2">
          <span>🖼️</span><span>Image</span>
        </button>
        <button onclick="switchMode('audio')" id="mode-audio" class="flex-1 py-2.5 rounded-xl font-medium text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2">
          <span>🔊</span><span>Audio</span>
        </button>
        <button onclick="switchMode('text')" id="mode-text" class="flex-1 py-2.5 rounded-xl font-medium text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2">
          <span>✍️</span><span>Text</span>
        </button>
      </div>
      
      <!-- Image Generation Panel -->
      <div id="panel-image" class="max-w-2xl mx-auto">
        <div class="card-glass rounded-2xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🖼️</span>
            <h3 class="text-lg font-semibold">Image Generation</h3>
            <span class="ml-auto text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">FLUX.1-schnell</span>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Prompt <span class="text-red-400">*</span></label>
              <textarea id="img-prompt" rows="3" placeholder="A majestic mountain landscape at golden hour, photorealistic, 8K quality..." class="input-field w-full px-4 py-3 rounded-xl resize-none"></textarea>
            </div>
            
            <div>
              <label class="block text-sm text-gray-400 mb-2">Style Preset</label>
              <div class="grid grid-cols-3 gap-2">
                <button onclick="setStyle(this,'photorealistic')" class="style-btn active-style px-3 py-2 rounded-lg text-xs font-medium border border-primary-500/50 bg-primary-500/20 text-primary-300">📸 Photo</button>
                <button onclick="setStyle(this,'digital art')" class="style-btn px-3 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/30">🎨 Digital Art</button>
                <button onclick="setStyle(this,'oil painting')" class="style-btn px-3 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/30">🖼️ Painting</button>
                <button onclick="setStyle(this,'anime')" class="style-btn px-3 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/30">⛩️ Anime</button>
                <button onclick="setStyle(this,'cyberpunk')" class="style-btn px-3 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/30">🤖 Cyberpunk</button>
                <button onclick="setStyle(this,'watercolor')" class="style-btn px-3 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/30">🎭 Watercolor</button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm text-gray-400 mb-2">Variants: <span id="variants-label">2</span></label>
              <input type="range" id="img-variants" min="1" max="4" value="2" oninput="document.getElementById('variants-label').textContent=this.value" class="w-full accent-primary-500" />
            </div>
            
            <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300">
              ⏱️ Free-tier inference may take 20-60s. Model may need warm-up time.
            </div>
            
            <button onclick="generateImage()" id="gen-img-btn" class="btn-primary w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2">
              <span id="gen-img-text"><i class="fas fa-magic mr-2"></i>Generate Images</span>
              <span id="gen-img-spinner" class="hidden items-center gap-2"><div class="spinner"></div><span>Generating...</span></span>
            </button>
          </div>
        </div>
        
        <!-- Image Results -->
        <div id="img-results" class="hidden mt-6">
          <h4 class="text-sm font-medium text-gray-400 mb-3">Generated Images <span class="text-xs text-gray-600">(AI-Generated)</span></h4>
          <div id="img-grid" class="grid grid-cols-2 gap-4"></div>
        </div>
      </div>
      
      <!-- Audio Generation Panel -->
      <div id="panel-audio" class="hidden max-w-2xl mx-auto">
        <div class="card-glass rounded-2xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🔊</span>
            <h3 class="text-lg font-semibold">Text-to-Speech</h3>
            <span class="ml-auto text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">HF TTS</span>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Text to speak <span class="text-red-400">*</span></label>
              <textarea id="audio-prompt" rows="4" placeholder="Enter the text you want to convert to speech..." class="input-field w-full px-4 py-3 rounded-xl resize-none"></textarea>
              <div class="text-xs text-gray-500 mt-1 text-right"><span id="audio-char-count">0</span>/500 characters</div>
            </div>
            
            <div>
              <label class="block text-sm text-gray-400 mb-2">Voice Style</label>
              <select id="audio-voice" class="input-field w-full px-4 py-3 rounded-xl">
                <option value="default">Default (Neutral)</option>
                <option value="male">Male Voice</option>
                <option value="female">Female Voice</option>
              </select>
            </div>
            
            <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
              ℹ️ Using open-source TTS via Hugging Face. Voice quality is limited compared to paid services (ElevenLabs, etc.). Free tier has rate limits.
            </div>
            
            <button onclick="generateAudio()" id="gen-audio-btn" class="btn-primary w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2">
              <span id="gen-audio-text"><i class="fas fa-microphone mr-2"></i>Generate Speech</span>
              <span id="gen-audio-spinner" class="hidden items-center gap-2"><div class="spinner"></div><span>Generating...</span></span>
            </button>
          </div>
        </div>
        
        <!-- Audio Results -->
        <div id="audio-results" class="hidden mt-6">
          <h4 class="text-sm font-medium text-gray-400 mb-3">Generated Audio <span class="text-xs text-gray-600">(AI-Generated)</span></h4>
          <div id="audio-player-container" class="card-glass rounded-xl p-4"></div>
        </div>
      </div>
      
      <!-- Text Generation Panel -->
      <div id="panel-text" class="hidden max-w-2xl mx-auto">
        <div class="card-glass rounded-2xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">✍️</span>
            <h3 class="text-lg font-semibold">Text Generation</h3>
            <span class="ml-auto text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">Groq llama-3.3-70b</span>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">Topic / Prompt <span class="text-red-400">*</span></label>
              <textarea id="text-prompt" rows="3" placeholder="Write a blog post about the future of AI in creative industries..." class="input-field w-full px-4 py-3 rounded-xl resize-none"></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Tone</label>
                <select id="text-tone" class="input-field w-full px-3 py-2.5 rounded-xl text-sm">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="creative">Creative</option>
                  <option value="academic">Academic</option>
                  <option value="humorous">Humorous</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2">Content Type</label>
                <select id="text-type" class="input-field w-full px-3 py-2.5 rounded-xl text-sm">
                  <option value="blog post">Blog Post</option>
                  <option value="essay">Essay</option>
                  <option value="story">Short Story</option>
                  <option value="product description">Product Description</option>
                  <option value="email">Email</option>
                  <option value="social media post">Social Media Post</option>
                  <option value="poem">Poem</option>
                  <option value="script">Script/Dialogue</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm text-gray-400 mb-2">Length</label>
              <div class="flex gap-2">
                <button onclick="setLength(this,'short')" class="length-btn flex-1 py-2 rounded-lg text-xs border border-primary-500/50 bg-primary-500/20 text-primary-300">Short</button>
                <button onclick="setLength(this,'medium')" class="length-btn flex-1 py-2 rounded-lg text-xs border border-white/10">Medium</button>
                <button onclick="setLength(this,'long')" class="length-btn flex-1 py-2 rounded-lg text-xs border border-white/10">Long</button>
              </div>
            </div>
            
            <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-300">
              ⚡ Powered by Groq (llama-3.3-70b-versatile) — blazing fast, free tier
            </div>
            
            <button onclick="generateText()" id="gen-text-btn" class="btn-primary w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2">
              <span id="gen-text-text"><i class="fas fa-pen-fancy mr-2"></i>Generate Text</span>
              <span id="gen-text-spinner" class="hidden items-center gap-2"><div class="spinner"></div><span>Writing...</span></span>
            </button>
          </div>
        </div>
        
        <!-- Text Results -->
        <div id="text-results" class="hidden mt-6">
          <div class="card-glass rounded-xl p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-300">Generated Text</span>
              <div class="flex gap-2">
                <span class="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">🤖 AI-Generated</span>
                <button onclick="copyText()" class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"><i class="fas fa-copy"></i> Copy</button>
              </div>
            </div>
            <div id="text-output" class="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Gallery Section -->
    <div id="section-gallery" class="hidden max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-bold text-white mb-1">My Gallery</h2>
          <p class="text-gray-400">All your AI-generated content</p>
        </div>
        <div class="flex gap-2">
          <button onclick="filterGallery('all')" id="filter-all" class="filter-btn px-3 py-1.5 rounded-lg text-sm tab-active">All</button>
          <button onclick="filterGallery('image')" id="filter-image" class="filter-btn px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white">Images</button>
          <button onclick="filterGallery('audio')" id="filter-audio" class="filter-btn px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white">Audio</button>
          <button onclick="filterGallery('text')" id="filter-text" class="filter-btn px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white">Text</button>
        </div>
      </div>
      
      <div id="gallery-loading" class="text-center py-20 text-gray-500">
        <div class="spinner mx-auto mb-4" style="width:40px;height:40px;border-width:4px;"></div>
        <p>Loading your generations...</p>
      </div>
      
      <div id="gallery-empty" class="hidden text-center py-20">
        <div class="text-6xl mb-4">🎨</div>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">No generations yet</h3>
        <p class="text-gray-500 mb-6">Start creating with AI!</p>
        <button onclick="showSection('generate')" class="btn-primary px-6 py-2.5 rounded-xl text-white font-medium">Start Creating</button>
      </div>
      
      <div id="gallery-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
    </div>
    
    <!-- Footer -->
    <footer class="border-t border-white/10 mt-16 py-8 text-center">
      <div class="max-w-7xl mx-auto px-4">
        <p class="text-gray-500 text-sm mb-2">🤖 All content generated by AI. Use responsibly.</p>
        <div class="flex items-center justify-center gap-4 text-xs text-gray-600">
          <button onclick="showTOS()" class="hover:text-gray-400 transition-colors">Terms of Service</button>
          <span>·</span>
          <span>Powered by Hugging Face & Groq</span>
          <span>·</span>
          <span>Free Tier — 20 generations/day</span>
        </div>
      </div>
    </footer>
  </div>
</div>

<!-- TOS Modal -->
<div id="tos-modal" class="hidden modal-overlay" onclick="if(event.target===this)hideTOS()">
  <div class="card-glass rounded-2xl p-8 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
    <h2 class="text-xl font-bold mb-4">Terms of Service</h2>
    <div class="text-sm text-gray-400 space-y-3">
      <p><strong class="text-white">1. AI-Generated Content Disclosure</strong><br>All content generated by this platform is AI-generated. We clearly disclose this on all outputs. Do not present AI content as human-created without disclosure.</p>
      <p><strong class="text-white">2. Prohibited Content</strong><br>You may NOT generate: content depicting real/identifiable individuals without consent, CSAM or content sexualizing minors, non-consensual intimate imagery, graphic violence, hate speech, or content designed to deceive or harm others.</p>
      <p><strong class="text-white">3. Free Tier Limitations</strong><br>Free accounts are limited to 20 generations per day across all modalities. We use shared free-tier API quotas from Hugging Face and Groq.</p>
      <p><strong class="text-white">4. Content Moderation</strong><br>All prompts are filtered before sending to AI models. Attempts to bypass safety filters will result in account suspension.</p>
      <p><strong class="text-white">5. Data & Privacy</strong><br>Your generations are stored to provide gallery functionality. We do not sell your data. Generations may be reviewed for safety compliance.</p>
      <p><strong class="text-white">6. Intellectual Property</strong><br>You are responsible for ensuring your prompts don't violate copyrights. AI-generated content may not be fully protected by copyright in all jurisdictions.</p>
    </div>
    <button onclick="hideTOS()" class="btn-primary w-full py-2.5 rounded-xl text-white mt-4 font-medium">I Understand</button>
  </div>
</div>

<script>
// ========== STATE ==========
let currentUser = null;
let authToken = null;
let currentMode = 'image';
let currentStyle = 'photorealistic';
let currentLength = 'short';
let galleryFilter = 'all';
let allGenerations = [];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('ai_studio_token');
  const user = localStorage.getItem('ai_studio_user');
  if (token && user) {
    authToken = token;
    currentUser = JSON.parse(user);
    showMainApp();
    loadUsage();
  }
  
  // Audio char counter
  document.getElementById('audio-prompt').addEventListener('input', (e) => {
    document.getElementById('audio-char-count').textContent = e.target.value.length;
  });
});

// ========== AUTH ==========
function showTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  
  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('tab-active');
    loginTab.classList.remove('text-gray-400');
    registerTab.classList.remove('tab-active');
    registerTab.classList.add('text-gray-400');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    registerTab.classList.add('tab-active');
    registerTab.classList.remove('text-gray-400');
    loginTab.classList.remove('tab-active');
    loginTab.classList.add('text-gray-400');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  setLoading('login', true);
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Login failed');
    
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('ai_studio_token', authToken);
    localStorage.setItem('ai_studio_user', JSON.stringify(currentUser));
    showMainApp();
    loadUsage();
    showToast('Welcome back, ' + currentUser.name + '! 👋', 'success');
  } catch(err) {
    showToast(err.message, 'error');
  } finally {
    setLoading('login', false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  
  setLoading('register', true);
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('ai_studio_token', authToken);
    localStorage.setItem('ai_studio_user', JSON.stringify(currentUser));
    showMainApp();
    loadUsage();
    showToast('Welcome to AI Studio, ' + currentUser.name + '! 🎉', 'success');
  } catch(err) {
    showToast(err.message, 'error');
  } finally {
    setLoading('register', false);
  }
}

function handleLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('ai_studio_token');
  localStorage.removeItem('ai_studio_user');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
  showToast('Signed out successfully', 'info');
}

function showMainApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
  showSection('generate');
}

// ========== NAVIGATION ==========
function showSection(section) {
  document.getElementById('section-generate').classList.add('hidden');
  document.getElementById('section-gallery').classList.add('hidden');
  document.getElementById('nav-generate').classList.remove('text-primary-400', 'font-semibold');
  document.getElementById('nav-gallery').classList.remove('text-primary-400', 'font-semibold');
  
  document.getElementById('section-' + section).classList.remove('hidden');
  document.getElementById('nav-' + section).classList.add('text-primary-400', 'font-semibold');
  
  if (section === 'gallery') loadGallery();
}

function switchMode(mode) {
  currentMode = mode;
  ['image','audio','text'].forEach(m => {
    document.getElementById('panel-' + m).classList.add('hidden');
    const btn = document.getElementById('mode-' + m);
    btn.classList.remove('tab-active');
    btn.classList.add('text-gray-400');
  });
  document.getElementById('panel-' + mode).classList.remove('hidden');
  const activeBtn = document.getElementById('mode-' + mode);
  activeBtn.classList.add('tab-active');
  activeBtn.classList.remove('text-gray-400');
}

// ========== IMAGE GENERATION ==========
function setStyle(btn, style) {
  currentStyle = style;
  document.querySelectorAll('.style-btn').forEach(b => {
    b.classList.remove('active-style', 'border-primary-500/50', 'bg-primary-500/20', 'text-primary-300');
    b.classList.add('border-white/10');
  });
  btn.classList.add('active-style', 'border-primary-500/50', 'bg-primary-500/20', 'text-primary-300');
  btn.classList.remove('border-white/10');
}

async function generateImage() {
  const prompt = document.getElementById('img-prompt').value.trim();
  if (!prompt) { showToast('Please enter a prompt', 'error'); return; }
  
  const variants = parseInt(document.getElementById('img-variants').value);
  setGenerating('img', true);
  document.getElementById('img-results').classList.add('hidden');
  
  try {
    const res = await fetch('/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify({ prompt, style: currentStyle, variants })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Generation failed');
    
    // Display images
    const grid = document.getElementById('img-grid');
    grid.innerHTML = '';
    data.images.forEach((img, i) => {
      const div = document.createElement('div');
      div.className = 'generation-card watermark relative rounded-xl overflow-hidden';
      div.innerHTML = \`
        <img src="\${img.url}" alt="Generated image \${i+1}" class="w-full aspect-square object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-between p-3">
          <span class="text-xs text-white">Variant \${i+1}</span>
          <div class="flex gap-2">
            <a href="\${img.url}" download="ai-generated-\${i+1}.jpg" class="text-white hover:text-primary-300 text-sm" title="Download"><i class="fas fa-download"></i></a>
            <button onclick="deleteGeneration('\${img.id}')" class="text-white hover:text-red-400 text-sm" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      \`;
      grid.appendChild(div);
    });
    
    document.getElementById('img-results').classList.remove('hidden');
    loadUsage();
    showToast(\`Generated \${data.images.length} image\${data.images.length > 1 ? 's' : ''}! 🎨\`, 'success');
  } catch(err) {
    showToast(err.message, 'error');
  } finally {
    setGenerating('img', false);
  }
}

// ========== AUDIO GENERATION ==========
async function generateAudio() {
  const text = document.getElementById('audio-prompt').value.trim();
  if (!text) { showToast('Please enter text to speak', 'error'); return; }
  if (text.length > 500) { showToast('Text too long (max 500 chars)', 'error'); return; }
  
  const voice = document.getElementById('audio-voice').value;
  setGenerating('audio', true);
  document.getElementById('audio-results').classList.add('hidden');
  
  try {
    const res = await fetch('/api/audio/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify({ text, voice })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Audio generation failed');
    
    const container = document.getElementById('audio-player-container');
    container.innerHTML = \`
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">🔊</span>
        <div>
          <div class="font-medium text-sm">\${data.filename || 'Generated Speech'}</div>
          <div class="text-xs text-gray-500">🤖 AI-Generated · \${new Date().toLocaleString()}</div>
        </div>
        <a href="\${data.url}" download="\${data.filename || 'speech.wav'}" class="ml-auto btn-primary px-3 py-1.5 rounded-lg text-xs text-white">
          <i class="fas fa-download mr-1"></i>Download
        </a>
      </div>
      <audio controls class="w-full" src="\${data.url}">
        Your browser does not support audio playback.
      </audio>
      <p class="text-xs text-gray-500 mt-2">Note: Free-tier TTS quality is limited. Consider ElevenLabs or Google TTS for production.</p>
    \`;
    
    document.getElementById('audio-results').classList.remove('hidden');
    loadUsage();
    showToast('Audio generated! 🔊', 'success');
  } catch(err) {
    showToast(err.message, 'error');
  } finally {
    setGenerating('audio', false);
  }
}

// ========== TEXT GENERATION ==========
function setLength(btn, length) {
  currentLength = length;
  document.querySelectorAll('.length-btn').forEach(b => {
    b.classList.remove('border-primary-500/50', 'bg-primary-500/20', 'text-primary-300');
    b.classList.add('border-white/10');
  });
  btn.classList.add('border-primary-500/50', 'bg-primary-500/20', 'text-primary-300');
  btn.classList.remove('border-white/10');
}

async function generateText() {
  const prompt = document.getElementById('text-prompt').value.trim();
  if (!prompt) { showToast('Please enter a prompt', 'error'); return; }
  
  const tone = document.getElementById('text-tone').value;
  const contentType = document.getElementById('text-type').value;
  
  setGenerating('text', true);
  document.getElementById('text-results').classList.add('hidden');
  
  try {
    const res = await fetch('/api/text/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify({ prompt, tone, contentType, length: currentLength })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Text generation failed');
    
    document.getElementById('text-output').textContent = data.text;
    document.getElementById('text-results').classList.remove('hidden');
    loadUsage();
    showToast('Text generated! ✍️', 'success');
  } catch(err) {
    showToast(err.message, 'error');
  } finally {
    setGenerating('text', false);
  }
}

function copyText() {
  const text = document.getElementById('text-output').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!', 'success'));
}

// ========== GALLERY ==========
async function loadGallery() {
  document.getElementById('gallery-loading').classList.remove('hidden');
  document.getElementById('gallery-empty').classList.add('hidden');
  document.getElementById('gallery-grid').classList.add('hidden');
  
  try {
    const res = await fetch('/api/gallery?type=' + (galleryFilter === 'all' ? '' : galleryFilter), {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    const data = await res.json();
    
    allGenerations = data.generations || [];
    renderGallery();
  } catch(err) {
    showToast('Failed to load gallery', 'error');
  } finally {
    document.getElementById('gallery-loading').classList.add('hidden');
  }
}

function filterGallery(type) {
  galleryFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('tab-active');
    b.classList.add('text-gray-400');
  });
  document.getElementById('filter-' + type).classList.add('tab-active');
  document.getElementById('filter-' + type).classList.remove('text-gray-400');
  
  const filtered = type === 'all' ? allGenerations : allGenerations.filter(g => g.type === type);
  renderGalleryItems(filtered);
}

function renderGallery() {
  const filtered = galleryFilter === 'all' ? allGenerations : allGenerations.filter(g => g.type === galleryFilter);
  renderGalleryItems(filtered);
}

function renderGalleryItems(items) {
  const grid = document.getElementById('gallery-grid');
  
  if (items.length === 0) {
    document.getElementById('gallery-empty').classList.remove('hidden');
    grid.classList.add('hidden');
    return;
  }
  
  document.getElementById('gallery-empty').classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = '';
  
  items.forEach(gen => {
    const card = document.createElement('div');
    card.className = 'generation-card card-glass rounded-xl overflow-hidden';
    
    const typeIcon = { image: '🖼️', audio: '🔊', text: '✍️' }[gen.type] || '📄';
    const typeColor = { image: 'purple', audio: 'blue', text: 'green' }[gen.type] || 'gray';
    
    let contentHTML = '';
    if (gen.type === 'image' && gen.result_url) {
      contentHTML = \`<div class="watermark"><img src="\${gen.result_url}" alt="Generated" class="w-full h-48 object-cover" /></div>\`;
    } else if (gen.type === 'audio' && gen.result_url) {
      contentHTML = \`<div class="h-24 flex items-center justify-center bg-blue-500/10"><span class="text-4xl">🔊</span></div>\`;
    } else if (gen.type === 'text' && gen.result_text) {
      contentHTML = \`<div class="h-24 p-3 text-xs text-gray-400 overflow-hidden">\${gen.result_text.substring(0,200)}...</div>\`;
    }
    
    card.innerHTML = \`
      \${contentHTML}
      <div class="p-3">
        <div class="flex items-start justify-between gap-2 mb-2">
          <p class="text-xs text-gray-300 line-clamp-2 flex-1">\${gen.prompt}</p>
          <span class="text-xs bg-\${typeColor}-500/20 text-\${typeColor}-300 px-1.5 py-0.5 rounded shrink-0">\${typeIcon}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">\${new Date(gen.created_at).toLocaleDateString()}</span>
          <div class="flex gap-2">
            \${gen.result_url ? \`<a href="\${gen.result_url}" download class="text-gray-500 hover:text-primary-400 text-xs" title="Download"><i class="fas fa-download"></i></a>\` : ''}
            <button onclick="deleteGeneration('\${gen.id}')" class="text-gray-500 hover:text-red-400 text-xs" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    \`;
    grid.appendChild(card);
  });
}

async function deleteGeneration(id) {
  if (!confirm('Delete this generation?')) return;
  
  try {
    const res = await fetch('/api/gallery/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    
    if (res.ok) {
      allGenerations = allGenerations.filter(g => g.id !== id);
      renderGallery();
      showToast('Deleted!', 'success');
    }
  } catch(err) {
    showToast('Failed to delete', 'error');
  }
}

// ========== USAGE ==========
async function loadUsage() {
  try {
    const res = await fetch('/api/auth/usage', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    const data = await res.json();
    document.getElementById('usage-display').textContent = \`\${data.used}/\${data.limit}\`;
  } catch(e) {}
}

// ========== UTILS ==========
function setGenerating(type, loading) {
  const text = document.getElementById(\`gen-\${type}-text\`);
  const spinner = document.getElementById(\`gen-\${type}-spinner\`);
  const btn = document.getElementById(\`gen-\${type}-btn\`);
  
  if (loading) {
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
    spinner.classList.add('flex');
    btn.disabled = true;
    btn.classList.add('opacity-75');
  } else {
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
    spinner.classList.remove('flex');
    btn.disabled = false;
    btn.classList.remove('opacity-75');
  }
}

function setLoading(type, loading) {
  const text = document.getElementById(\`\${type}-text\`);
  const spinner = document.getElementById(\`\${type}-spinner\`);
  const btn = document.getElementById(\`\${type}-btn\`);
  
  if (loading) {
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
    btn.disabled = true;
  } else {
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
    btn.disabled = false;
  }
}

function showToast(message, type = 'info') {
  const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600', warning: 'bg-yellow-600' };
  const toast = document.createElement('div');
  toast.className = \`toast \${colors[type]} text-white text-sm shadow-xl\`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showTOS() { document.getElementById('tos-modal').classList.remove('hidden'); }
function hideTOS() { document.getElementById('tos-modal').classList.add('hidden'); }
</script>
</body>
</html>`
}

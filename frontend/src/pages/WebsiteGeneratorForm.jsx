import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const WEBSITE_TYPES = ['Portfolio', 'Business', 'Restaurant', 'E-Commerce', 'Blog', 'Landing Page', 'Agency', 'Medical / Clinic']
const STYLES        = ['Modern & Minimal', 'Classic & Professional', 'Bold & Colorful', 'Elegant & Luxury']
const SECTIONS      = ['Hero / Banner', 'About Us', 'Services', 'Portfolio / Gallery', 'Testimonials', 'Team', 'Pricing', 'FAQ', 'Contact', 'Footer']
const COLORS        = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#0f172a','#0ea5e9','#14b8a6']

const EMPTY = {
  name:         '',
  type:         '',
  description:  '',
  audience:     '',
  style:        '',
  color:        '#6366f1',
  sections:     [],
  email:        '',
  phone:        '',
  social:       '',
  extra:        '',
}

function buildPrompt(d) {
  return `You are an expert web developer. Generate a complete, beautiful, single-file HTML website based on the following requirements.
Output ONLY raw HTML code — no markdown fences, no explanation, no comments outside the code.

Requirements:
- Website Name: ${d.name}
- Website Type: ${d.type}
- Description: ${d.description}
- Target Audience: ${d.audience || 'General public'}
- Visual Style: ${d.style}
- Primary Color: ${d.color}
- Sections to include: ${d.sections.join(', ')}
- Contact Email: ${d.email || 'Not provided'}
- Phone: ${d.phone || 'Not provided'}
- Social Media / Links: ${d.social || 'Not provided'}
- Additional Notes: ${d.extra || 'None'}

Instructions:
1. Use inline CSS only (no external stylesheets or CDN links).
2. Use the primary color ${d.color} as the main accent/brand color throughout.
3. Make it fully responsive for mobile, tablet, and desktop.
4. Include smooth scroll behavior.
5. Include all sections listed above with realistic placeholder content relevant to the business type.
6. Make it visually polished and production-ready.
7. Include a sticky navigation bar with links to each section.
8. Output ONLY the complete HTML document starting with <!DOCTYPE html>.`
}

export default function WebsiteGeneratorForm() {
  const nav = useNavigate()

  const [data,       setData]       = useState(EMPTY)
  const [errors,     setErrors]     = useState({})
  const [step,       setStep]       = useState('form')   // 'form' | 'loading' | 'result'
  const [progress,   setProgress]   = useState('')
  const [generated,  setGenerated]  = useState('')
  const [copied,     setCopied]     = useState(false)
  const [previewOpen,setPreviewOpen]= useState(false)
  const [aiPicker,   setAiPicker]   = useState(false)
  const [aiProvider, setAiProvider] = useState(null)   // 'gemini' | 'llama'
  const [geminiKey,  setGeminiKey]  = useState('')

  const set = (key, val) => {
    setData(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: null }))
  }

  const toggleSection = (s) => {
    setData(p => ({
      ...p,
      sections: p.sections.includes(s) ? p.sections.filter(x => x !== s) : [...p.sections, s],
    }))
  }

  const validate = () => {
    const e = {}
    if (!data.name.trim())        e.name        = 'Required'
    if (!data.type)               e.type        = 'Required'
    if (!data.description.trim()) e.description = 'Required'
    if (!data.style)              e.style       = 'Required'
    if (data.sections.length === 0) e.sections  = 'Select at least one section'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAiPicker = () => {
    if (!validate()) return
    setAiPicker(true)
  }

  const generateWithLlama = async () => {
    setAiPicker(false)
    setStep('loading')
    setProgress('Connecting to Llama...')
    setGenerated('')

    const prompt = buildPrompt(data)
    let html = ''

    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', prompt, stream: true }),
      })

      if (!res.ok) throw new Error(`Ollama error: ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      setProgress('Generating website...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.trim()) continue
          try {
            const obj = JSON.parse(line)
            if (obj.response) { html += obj.response; setGenerated(html) }
          } catch { /* partial line */ }
        }
      }
      setStep('result')
    } catch (err) {
      setStep('form')
      alert(
        `Could not connect to Ollama.\n\nMake sure Ollama is running locally:\n  brew install ollama\n  ollama serve\n  ollama pull llama3\n\nError: ${err.message}`
      )
    }
  }

  const generateWithGemini = async () => {
    if (!geminiKey.trim()) { alert('Please enter your Gemini API key.'); return }
    setAiPicker(false)
    setStep('loading')
    setProgress('Connecting to Gemini...')
    setGenerated('')

    const prompt = buildPrompt(data)

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Gemini error: ${res.status}`)
      }

      const json = await res.json()
      const html = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (!html) throw new Error('Gemini returned an empty response.')
      setGenerated(html)
      setStep('result')
    } catch (err) {
      setStep('form')
      alert(`Gemini generation failed.\n\nError: ${err.message}`)
    }
  }

  // keep old name so Regenerate button still works
  const generate = aiProvider === 'gemini' ? generateWithGemini : generateWithLlama

  const copyCode = () => {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadHtml = () => {
    const blob = new Blob([generated], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${data.name.replace(/\s+/g, '-').toLowerCase() || 'website'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Loading screen ── */
  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32 }}>
      <div style={{ fontSize: 52 }}>
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 20 }}>Generating your website…</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{progress}</div>
      {generated && (
        <div style={{ width: '100%', maxWidth: 700, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, fontSize: 12, fontFamily: 'monospace', overflowY: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--muted)' }}>
          {generated.slice(-1200)}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  /* ── Result screen ── */
  if (step === 'result') return (
    <>
      <nav className="nav">
        <button className="btn btn-ghost btn-sm" onClick={() => setStep('form')}>← Edit Form</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15, marginLeft: 10 }}>
          {data.name} — Generated Website
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPreviewOpen(true)}>Preview</button>
          <button className="btn btn-ghost btn-sm" onClick={copyCode}>{copied ? 'Copied!' : 'Copy HTML'}</button>
          <button className="btn btn-primary btn-sm" onClick={downloadHtml}>Download .html</button>
        </div>
      </nav>

      <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>index.html</span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#94a3b8', border: '1px solid #334155', fontSize: 12 }}
              onClick={copyCode}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre style={{ margin: 0, color: '#e2e8f0', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '65vh', overflowY: 'auto' }}>
            {generated}
          </pre>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => setStep('form')}>Edit Requirements</button>
          <button className="btn btn-ghost" onClick={generate}>Regenerate</button>
          <button className="btn btn-primary" onClick={downloadHtml}>Download Website</button>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setPreviewOpen(false)}>
          <div style={{ width: '90vw', height: '85vh', background: 'white', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Preview — {data.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewOpen(false)}>Close</button>
            </div>
            <iframe
              style={{ flex: 1, border: 'none' }}
              srcDoc={generated}
              title="Website Preview"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </>
  )

  /* ── Form screen ── */
  const filled = Math.round(
    ([data.name, data.type, data.description, data.style].filter(Boolean).length / 4) * 100
  )

  return (
    <>
      <nav className="nav">
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/')}>← Dashboard</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15, marginLeft: 10 }}>AI Website Generator</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filled}% filled</span>
      </nav>

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${filled}%`, background: data.color }} />
      </div>

      <div className="fv-wrap" style={{ maxWidth: 680 }}>

        {/* Header card */}
        <div className="fv-header">
          <div className="fv-header-banner" style={{ background: data.color }} />
          <div className="fv-header-body">
            <div className="fv-title">AI Website Generator</div>
            <div className="fv-desc">
              Fill in your website requirements and Llama will generate a complete, ready-to-use HTML website for you.
            </div>
            <div className="fv-req-note">
              <span style={{ color: 'var(--err)', fontSize: 14 }}>*</span> Required fields
            </div>
          </div>
        </div>

        {/* 1. Website Name */}
        <div className={`fv-q ${errors.name ? 'has-error' : ''}`}>
          <div className="fv-q-num">Question 1</div>
          <div className="fv-q-label">What is your website / business name? <span className="req">*</span></div>
          <input
            className={`input ${errors.name ? 'error' : ''}`}
            placeholder="e.g. Coastal Bites Restaurant"
            value={data.name}
            onChange={e => set('name', e.target.value)}
          />
          {errors.name && <div className="fv-error">This field is required</div>}
        </div>

        {/* 2. Website Type */}
        <div className={`fv-q ${errors.type ? 'has-error' : ''}`}>
          <div className="fv-q-num">Question 2</div>
          <div className="fv-q-label">What type of website do you need? <span className="req">*</span></div>
          <div className="fv-opts">
            {WEBSITE_TYPES.map(t => (
              <div
                key={t}
                className={`fv-opt ${data.type === t ? 'selected' : ''}`}
                onClick={() => set('type', t)}
              >
                <input type="radio" readOnly checked={data.type === t} />
                <span className="fv-opt-label">{t}</span>
              </div>
            ))}
          </div>
          {errors.type && <div className="fv-error">Please select a website type</div>}
        </div>

        {/* 3. Description */}
        <div className={`fv-q ${errors.description ? 'has-error' : ''}`}>
          <div className="fv-q-num">Question 3</div>
          <div className="fv-q-label">Describe your business or website purpose <span className="req">*</span></div>
          <textarea
            className={`input ${errors.description ? 'error' : ''}`}
            placeholder="e.g. A coastal seafood restaurant in Miami serving fresh catches daily. Known for our lobster rolls and ocean-view dining experience."
            rows={4}
            value={data.description}
            onChange={e => set('description', e.target.value)}
          />
          {errors.description && <div className="fv-error">Please describe your website</div>}
        </div>

        {/* 4. Target Audience */}
        <div className="fv-q">
          <div className="fv-q-num">Question 4</div>
          <div className="fv-q-label">Who is your target audience?</div>
          <input
            className="input"
            placeholder="e.g. Tourists, local families, seafood lovers aged 25–55"
            value={data.audience}
            onChange={e => set('audience', e.target.value)}
          />
        </div>

        {/* 5. Visual Style */}
        <div className={`fv-q ${errors.style ? 'has-error' : ''}`}>
          <div className="fv-q-num">Question 5</div>
          <div className="fv-q-label">What visual style do you prefer? <span className="req">*</span></div>
          <div className="fv-opts">
            {STYLES.map(s => (
              <div
                key={s}
                className={`fv-opt ${data.style === s ? 'selected' : ''}`}
                onClick={() => set('style', s)}
              >
                <input type="radio" readOnly checked={data.style === s} />
                <span className="fv-opt-label">{s}</span>
              </div>
            ))}
          </div>
          {errors.style && <div className="fv-error">Please select a style</div>}
        </div>

        {/* 6. Primary Color */}
        <div className="fv-q">
          <div className="fv-q-num">Question 6</div>
          <div className="fv-q-label">Choose your primary brand color</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            {COLORS.map(c => (
              <div
                key={c}
                onClick={() => set('color', c)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: data.color === c ? '3px solid var(--text)' : '3px solid transparent',
                  boxShadow: data.color === c ? '0 0 0 2px white, 0 0 0 4px var(--text)' : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
            <input
              type="color"
              value={data.color}
              onChange={e => set('color', e.target.value)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 2 }}
              title="Custom color"
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Selected: <code>{data.color}</code></div>
        </div>

        {/* 7. Sections */}
        <div className={`fv-q ${errors.sections ? 'has-error' : ''}`}>
          <div className="fv-q-num">Question 7</div>
          <div className="fv-q-label">Which sections should your website include? <span className="req">*</span></div>
          <div className="fv-opts">
            {SECTIONS.map(s => {
              const checked = data.sections.includes(s)
              return (
                <div
                  key={s}
                  className={`fv-opt ${checked ? 'selected' : ''}`}
                  onClick={() => { toggleSection(s); setErrors(p => ({ ...p, sections: null })) }}
                >
                  <input type="checkbox" readOnly checked={checked} />
                  <span className="fv-opt-label">{s}</span>
                </div>
              )
            })}
          </div>
          {errors.sections && <div className="fv-error">Select at least one section</div>}
        </div>

        {/* 8. Contact Email */}
        <div className="fv-q">
          <div className="fv-q-num">Question 8</div>
          <div className="fv-q-label">Contact email address</div>
          <input
            className="input"
            type="email"
            placeholder="hello@yourbusiness.com"
            value={data.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>

        {/* 9. Phone */}
        <div className="fv-q">
          <div className="fv-q-num">Question 9</div>
          <div className="fv-q-label">Phone number</div>
          <input
            className="input"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={data.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>

        {/* 10. Social Media */}
        <div className="fv-q">
          <div className="fv-q-num">Question 10</div>
          <div className="fv-q-label">Social media links or handles</div>
          <textarea
            className="input"
            placeholder="Instagram: @coastalbites&#10;Facebook: facebook.com/coastalbites&#10;Twitter: @coastalbites"
            rows={3}
            value={data.social}
            onChange={e => set('social', e.target.value)}
          />
        </div>

        {/* 11. Extra notes */}
        <div className="fv-q">
          <div className="fv-q-num">Question 11</div>
          <div className="fv-q-label">Any additional notes or special requirements?</div>
          <textarea
            className="input"
            placeholder="e.g. Include a reservation form, add a menu page, use a beach/ocean theme with wave patterns..."
            rows={3}
            value={data.extra}
            onChange={e => set('extra', e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="fv-submit">
          <button style={{ background: data.color }} onClick={openAiPicker}>
            Generate Website →
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', paddingBottom: 32 }}>
          Choose Gemini (cloud) or Llama (local) to generate your website.
        </div>
      </div>

      {/* AI PROVIDER PICKER POPUP */}
      {aiPicker && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setAiPicker(false)}>
          <div className="modal modal-lg">
            <div className="modal-title" style={{ textAlign: 'center' }}>Choose AI Provider</div>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 24, marginTop: -12 }}>
              Select which AI will generate your website
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* Gemini card */}
              <div
                onClick={() => setAiProvider('gemini')}
                style={{
                  padding: '20px 16px', borderRadius: 'var(--r)',
                  border: `2px solid ${aiProvider === 'gemini' ? '#4285F4' : 'var(--border)'}`,
                  background: aiProvider === 'gemini' ? '#eff6ff' : 'var(--card)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Gemini</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Google Gemini 1.5 Flash — cloud, fast, requires API key</div>
              </div>

              {/* Llama card */}
              <div
                onClick={() => setAiProvider('llama')}
                style={{
                  padding: '20px 16px', borderRadius: 'var(--r)',
                  border: `2px solid ${aiProvider === 'llama' ? '#10b981' : 'var(--border)'}`,
                  background: aiProvider === 'llama' ? '#f0fdf4' : 'var(--card)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>🦙</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Lala (Llama)</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Meta Llama 3 via Ollama — runs locally, no API key needed</div>
              </div>
            </div>

            {/* Gemini API key input */}
            {aiProvider === 'gemini' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>
                  Gemini API Key <span style={{ color: 'var(--err)' }}>*</span>
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="AIza..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  autoFocus
                />
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                  Get a free key from Google AI Studio.
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setAiPicker(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                disabled={!aiProvider}
                onClick={aiProvider === 'gemini' ? generateWithGemini : generateWithLlama}
                style={{ background: aiProvider === 'gemini' ? '#4285F4' : aiProvider === 'llama' ? '#10b981' : undefined }}
              >
                {aiProvider === 'gemini' ? 'Generate with Gemini' : aiProvider === 'llama' ? 'Generate with Lala' : 'Select a provider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

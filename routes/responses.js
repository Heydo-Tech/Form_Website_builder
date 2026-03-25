const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { loadForm, loadResponses, saveResponses } = require('../utils/storage')
const { buildStats, getAISummary } = require('../utils/ai')

const router = express.Router({ mergeParams: true })   // inherit :id from parent

/* ── POST /api/forms/:id/responses ── submit a response ────────────── */
router.post('/', (req, res) => {
  try {
    const form = loadForm(req.params.id)
    if (!form)                           return res.status(404).json({ error: 'Form not found' })
    if (!form.accepting_responses)       return res.status(400).json({ error: 'This form is no longer accepting responses' })
    if (!req.body || !req.body.answers)  return res.status(400).json({ error: 'No answers provided' })

    const response = {
      id:           uuidv4().slice(0, 8),
      submitted_at: new Date().toISOString(),
      answers:      req.body.answers,
    }

    const responses = loadResponses(req.params.id)
    responses.push(response)
    saveResponses(req.params.id, responses)

    res.status(201).json(response)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── GET /api/forms/:id/responses ── all responses ─────────────────── */
router.get('/', (req, res) => {
  try {
    const form = loadForm(req.params.id)
    if (!form) return res.status(404).json({ error: 'Form not found' })
    res.json(loadResponses(req.params.id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── DELETE /api/forms/:id/responses ── clear all responses ─────────── */
router.delete('/', (req, res) => {
  try {
    const form = loadForm(req.params.id)
    if (!form) return res.status(404).json({ error: 'Form not found' })
    saveResponses(req.params.id, [])
    res.json({ ok: true, message: 'All responses cleared' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── DELETE /api/forms/:id/responses/:rid ── delete one response ────── */
router.delete('/:rid', (req, res) => {
  try {
    const form = loadForm(req.params.id)
    if (!form) return res.status(404).json({ error: 'Form not found' })

    const responses = loadResponses(req.params.id)
    const idx = responses.findIndex(r => r.id === req.params.rid)
    if (idx === -1) return res.status(404).json({ error: 'Response not found' })

    responses.splice(idx, 1)
    saveResponses(req.params.id, responses)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── GET /api/forms/:id/summary ── analytics + AI summary ───────────── */
router.get('/summary', async (req, res) => {
  try {
    const form = loadForm(req.params.id)
    if (!form) return res.status(404).json({ error: 'Form not found' })

    const responses = loadResponses(req.params.id)
    if (!responses.length) {
      return res.json({ total: 0, stats: {}, ai_summary: 'No responses yet.' })
    }

    const stats = buildStats(form, responses)

    // AI summary (Ollama) — gracefully degrade if unavailable
    let ai_summary = 'AI summary unavailable — make sure Ollama is running.'
    try {
      ai_summary = await getAISummary(form, responses, stats)
    } catch (_) { /* Ollama offline */ }

    res.json({ total: responses.length, stats, ai_summary })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── GET /api/forms/:id/export ── download responses as CSV ─────────── */
router.get('/export', (req, res) => {
  try {
    const form = loadForm(req.params.id)
    if (!form) return res.status(404).json({ error: 'Form not found' })

    const responses = loadResponses(req.params.id)
    if (!responses.length) return res.status(400).json({ error: 'No responses to export' })

    // Build CSV header
    const headers = ['Response ID', 'Submitted At', ...form.questions.map(q => q.question || q.id)]
    const rows = responses.map(r => [
      r.id,
      r.submitted_at,
      ...form.questions.map(q => {
        const a = r.answers[q.id]
        if (a === undefined || a === null) return ''
        if (Array.isArray(a)) return a.join(' | ')
        return String(a)
      }),
    ])

    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')

    const filename = `${form.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

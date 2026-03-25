const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { loadForm, saveForm, listForms, deleteForm, loadResponses } = require('../utils/storage')

const router = express.Router()

/* ── GET /api/forms ── list all forms ──────────────────────────────── */
router.get('/', (req, res) => {
  try {
    const forms = listForms().map(f => ({
      ...f,
      response_count: loadResponses(f.id).length,
    }))
    forms.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    res.json(forms)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── POST /api/forms ── create form ────────────────────────────────── */
router.post('/', (req, res) => {
  try {
    const { title, description, questions, theme_color } = req.body
    const form = {
      id:                  uuidv4().slice(0, 8),
      title:               title || 'Untitled Form',
      description:         description || '',
      questions:           questions   || [],
      theme_color:         theme_color || '#6366f1',
      accepting_responses: true,
      created_at:          new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    }
    saveForm(form)
    res.status(201).json(form)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── GET /api/forms/:id ── get single form ─────────────────────────── */
router.get('/:id', (req, res) => {
  const form = loadForm(req.params.id)
  if (!form) return res.status(404).json({ error: 'Form not found' })
  res.json(form)
})

/* ── PUT /api/forms/:id ── update form ─────────────────────────────── */
router.put('/:id', (req, res) => {
  const form = loadForm(req.params.id)
  if (!form) return res.status(404).json({ error: 'Form not found' })

  const allowed = ['title', 'description', 'questions', 'theme_color', 'accepting_responses']
  allowed.forEach(k => { if (req.body[k] !== undefined) form[k] = req.body[k] })
  form.updated_at = new Date().toISOString()

  saveForm(form)
  res.json(form)
})

/* ── DELETE /api/forms/:id ── delete form + responses ──────────────── */
router.delete('/:id', (req, res) => {
  const form = loadForm(req.params.id)
  if (!form) return res.status(404).json({ error: 'Form not found' })
  deleteForm(req.params.id)
  res.json({ ok: true, message: 'Form and all responses deleted' })
})

/* ── POST /api/forms/:id/duplicate ── clone a form ─────────────────── */
router.post('/:id/duplicate', (req, res) => {
  const original = loadForm(req.params.id)
  if (!original) return res.status(404).json({ error: 'Form not found' })

  const clone = {
    ...JSON.parse(JSON.stringify(original)),
    id:          uuidv4().slice(0, 8),
    title:       `${original.title} (Copy)`,
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString(),
    // reset question IDs too
    questions: original.questions.map(q => ({
      ...q,
      id: 'q_' + Date.now() + Math.random().toString(36).slice(2, 6),
    })),
  }
  saveForm(clone)
  res.status(201).json(clone)
})

/* ── PATCH /api/forms/:id/toggle ── open / close responses ─────────── */
router.patch('/:id/toggle', (req, res) => {
  const form = loadForm(req.params.id)
  if (!form) return res.status(404).json({ error: 'Form not found' })
  form.accepting_responses = !form.accepting_responses
  form.updated_at = new Date().toISOString()
  saveForm(form)
  res.json({ id: form.id, accepting_responses: form.accepting_responses })
})

module.exports = router

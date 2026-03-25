const BASE = '/api'

const json = async (r) => {
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error || r.statusText)
  }
  return r.json()
}

const h = { 'Content-Type': 'application/json' }

export const api = {
  // ── Forms ──────────────────────────────────────────────────────────
  listForms:      ()        => fetch(`${BASE}/forms`).then(json),
  createForm:     (data)    => fetch(`${BASE}/forms`, { method:'POST', headers:h, body:JSON.stringify(data) }).then(json),
  getForm:        (id)      => fetch(`${BASE}/forms/${id}`).then(json),
  updateForm:     (id, d)   => fetch(`${BASE}/forms/${id}`, { method:'PUT', headers:h, body:JSON.stringify(d) }).then(json),
  deleteForm:     (id)      => fetch(`${BASE}/forms/${id}`, { method:'DELETE' }).then(json),
  duplicateForm:  (id)      => fetch(`${BASE}/forms/${id}/duplicate`, { method:'POST' }).then(json),
  toggleForm:     (id)      => fetch(`${BASE}/forms/${id}/toggle`, { method:'PATCH' }).then(json),

  // ── Responses ──────────────────────────────────────────────────────
  submitResponse: (id, ans) => fetch(`${BASE}/forms/${id}/responses`, { method:'POST', headers:h, body:JSON.stringify({ answers:ans }) }).then(json),
  getResponses:   (id)      => fetch(`${BASE}/forms/${id}/responses`).then(json),
  clearResponses: (id)      => fetch(`${BASE}/forms/${id}/responses`, { method:'DELETE' }).then(json),
  deleteResponse: (id, rid) => fetch(`${BASE}/forms/${id}/responses/${rid}`, { method:'DELETE' }).then(json),
  getSummary:     (id)      => fetch(`${BASE}/forms/${id}/responses/summary`).then(json),
  exportCSV:      (id)      => window.open(`${BASE}/forms/${id}/responses/export`, '_blank'),

  // ── Health ─────────────────────────────────────────────────────────
  health:         ()        => fetch(`${BASE}/health`).then(json),
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../context/ToastContext'

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#0f172a']

export default function Dashboard() {
  const nav   = useNavigate()
  const toast = useToast()
  const [forms,  setForms]  = useState([])
  const [query,  setQuery]  = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newForm, setNewForm] = useState({ title: '', description: '', theme_color: '#6366f1' })

  useEffect(() => {
    api.listForms().then(setForms).finally(() => setLoading(false))
  }, [])

  const filtered = forms.filter(f =>
    f.title.toLowerCase().includes(query.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(query.toLowerCase())
  )

  const totalResponses = forms.reduce((s, f) => s + (f.response_count || 0), 0)
  const activeForms    = forms.filter(f => f.accepting_responses).length

  const openModal = () => {
    setNewForm({ title: '', description: '', theme_color: '#6366f1' })
    setShowModal(true)
  }

  const createForm = async () => {
    if (!newForm.title.trim()) return
    const f = await api.createForm(newForm)
    setShowModal(false)
    nav(`/builder/${f.id}`)
  }

  const deleteForm = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this form and all its responses?')) return
    await api.deleteForm(id)
    setForms(p => p.filter(f => f.id !== id))
    toast('🗑 Form deleted')
  }

  const duplicateForm = async (id, e) => {
    e.stopPropagation()
    const clone = await api.duplicateForm(id)
    setForms(p => [{ ...clone, response_count: 0 }, ...p])
    toast('⧉ Form duplicated!')
  }

  const toggleForm = async (id, e) => {
    e.stopPropagation()
    const result = await api.toggleForm(id)
    setForms(p => p.map(f => f.id === id ? { ...f, accepting_responses: result.accepting_responses } : f))
    toast(result.accepting_responses ? '✅ Form opened' : '🔒 Form closed')
  }

  const shareForm = (id, e) => {
    e.stopPropagation()
    const url = `${location.origin}/form/${id}`
    navigator.clipboard.writeText(url)
    toast('🔗 Share link copied!')
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">✦</div>
          <span className="nav-logo-text">Form<span>Craft</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => nav('/website-generator')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Website Generator
          </button>
          <button className="btn btn-primary" onClick={openModal}>＋ New Form</button>
        </div>
      </nav>

      <div className="dashboard-body">
        {/* HEADING */}
        <div className="mb-6">
          <h1 className="page-heading">Your <span style={{ color: 'var(--p)' }}>Forms</span></h1>
          <p className="page-sub">Build beautiful forms, share them, and analyze responses — powered by local AI.</p>
        </div>

        {/* STATS */}
        <div className="stats-row">
          {[
            { icon: '📋', label: 'Total Forms',     value: forms.length,    bg: '#eef2ff' },
            { icon: '📥', label: 'Total Responses', value: totalResponses,  bg: '#f0fdf4' },
            { icon: '✅', label: 'Active Forms',    value: activeForms,     bg: '#fff7ed' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{loading ? '—' : s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI WEBSITE GENERATOR CARD */}
        <div
          onClick={() => nav('/website-generator')}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            borderRadius: 'var(--r)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            cursor: 'pointer',
            marginBottom: 24,
            color: 'white',
            boxShadow: '0 4px 24px rgba(99,102,241,0.25)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.25)' }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>AI Website Generator</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Fill in your website requirements and let Llama generate a complete, ready-to-use HTML website for you.
            </div>
          </div>
          <div style={{ fontSize: 28, flexShrink: 0 }}>Generate Website →</div>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="search-box">
            <span style={{ color: 'var(--muted)', fontSize: 16 }}>🔍</span>
            <input
              placeholder="Search forms…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openModal}>＋ Create Form</button>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ fontSize: 32 }}>⏳</div>
            <p className="text-muted mt-1" style={{ marginTop: 12 }}>Loading forms…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{query ? '🔍' : '📋'}</div>
            <div className="empty-h">{query ? 'No matching forms' : 'No forms yet'}</div>
            <p className="empty-p">{query ? 'Try a different search term.' : 'Create your first form and start collecting responses.'}</p>
            {!query && <button className="btn btn-primary" onClick={openModal}>＋ Create New Form</button>}
          </div>
        ) : (
          <div className="forms-grid">
            {filtered.map(f => (
              <FormCard
                key={f.id}
                form={f}
                onEdit={() => nav(`/builder/${f.id}`)}
                onShare={(e) => shareForm(f.id, e)}
                onResults={() => nav(`/responses/${f.id}`)}
                onDuplicate={(e) => duplicateForm(f.id, e)}
                onToggle={(e) => toggleForm(f.id, e)}
                onDelete={(e) => deleteForm(f.id, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">✦ Create New Form</div>
            <div className="form-group">
              <label className="form-label">Form Title *</label>
              <input
                className="input"
                placeholder="e.g. Customer Feedback Survey"
                value={newForm.title}
                onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && createForm()}
                autoFocus
                maxLength={80}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="input"
                placeholder="Tell respondents what this form is about…"
                value={newForm.description}
                onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Theme Color</label>
              <div className="color-grid">
                {COLORS.map(c => (
                  <div
                    key={c}
                    className={`color-dot ${newForm.theme_color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewForm(p => ({ ...p, theme_color: c }))}
                  />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createForm} disabled={!newForm.title.trim()}>
                Create & Build →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FormCard({ form, onEdit, onShare, onResults, onDuplicate, onToggle, onDelete }) {
  const color = form.theme_color || '#6366f1'
  const date  = new Date(form.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="form-card" onClick={onEdit}>
      <div className="form-card-top" style={{ background: color }} />
      <div className="form-card-body">
        <div className="form-card-title">{form.title}</div>
        <div className="form-card-desc">
          {form.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description</span>}
        </div>
        <div className="form-card-meta">
          <span className="badge badge-blue">❓ {form.questions?.length || 0} Questions</span>
          <span className="badge badge-green">📥 {form.response_count || 0} Responses</span>
          {form.accepting_responses
            ? <span className="badge badge-green">✅ Active</span>
            : <span className="badge badge-red">🔒 Closed</span>}
        </div>
        <div className="form-card-date">Updated {date}</div>
      </div>
      <div className="card-actions" onClick={e => e.stopPropagation()}>
        {[
          { icon: '✏️', label: 'Edit',      fn: onEdit      },
          { icon: '🔗', label: 'Share',     fn: onShare     },
          { icon: '📊', label: 'Results',   fn: onResults   },
          { icon: '⧉',  label: 'Duplicate', fn: onDuplicate },
          { icon: form.accepting_responses ? '🔒' : '✅', label: form.accepting_responses ? 'Close' : 'Open', fn: onToggle },
          { icon: '🗑', label: 'Delete',    fn: onDelete, danger: true },
        ].map(a => (
          <button key={a.label} className={`card-action ${a.danger ? 'danger' : ''}`} onClick={a.fn}>
            <span className="ca-icon">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

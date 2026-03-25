import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { api } from '../api'
import { useToast } from '../context/ToastContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const CHART_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4']

const TYPE_LABELS = {
  text:'Short Answer', paragraph:'Paragraph', mcq:'Multiple Choice',
  checkbox:'Checkboxes', dropdown:'Dropdown', true_false:'True / False',
  rating:'Rating', date:'Date',
}

export default function Responses() {
  const { id } = useParams()
  const nav    = useNavigate()
  const toast  = useToast()

  const [form,    setForm]    = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getForm(id), api.getSummary(id)])
      .then(([f, s]) => { setForm(f); setSummary(s) })
      .catch(() => toast('Failed to load', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const shareUrl = `${location.origin}/form/${id}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast('🔗 Link copied!')
  }

  const clearAll = async () => {
    if (!confirm('Delete ALL responses for this form? This cannot be undone.')) return
    await api.clearResponses(id)
    setSummary(p => ({ ...p, total: 0, stats: {}, ai_summary: 'No responses yet.' }))
    toast('🗑 All responses cleared')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
      <div className="spinner" style={{ fontSize: 36 }}>⏳</div>
      <p style={{ marginTop: 14 }}>Loading results…</p>
    </div>
  )

  if (!form) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2 style={{ color: 'var(--err)' }}>Form not found</h2>
    </div>
  )

  const total = summary?.total || 0
  const color = form.theme_color || '#6366f1'

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/')}>← Dashboard</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15, marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {form.title}
        </span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => nav(`/builder/${id}`)}>✏️ Edit</button>
          {summary?.total > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => api.exportCSV(id)}>⬇️ Export CSV</button>
          )}
          {summary?.total > 0 && (
            <button className="btn btn-danger btn-sm" onClick={clearAll}>🗑 Clear All</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={copyLink}>🔗 Share</button>
        </div>
      </nav>

      <div className="resp-body">
        {/* Share row */}
        <div className="share-row">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Share link:</span>
          <input className="share-url" value={shareUrl} readOnly onClick={e => e.target.select()} />
          <button className="btn btn-primary btn-sm" onClick={copyLink}>Copy</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/form/${id}`, '_blank')}>Open Form ↗</button>
        </div>

        {/* Stats */}
        <div className="stats-row mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          {[
            { icon: '📥', label: 'Total Responses', value: total,                    bg: '#eef2ff' },
            { icon: '❓', label: 'Questions',        value: form.questions?.length||0, bg: '#f0fdf4' },
            {
              icon: form.accepting_responses ? '✅' : '🔒',
              label: 'Status',
              value: form.accepting_responses ? 'Active' : 'Closed',
              bg: form.accepting_responses ? '#f0fdf4' : '#fef2f2',
              valueColor: form.accepting_responses ? '#16a34a' : 'var(--err)',
              valueSize: 16,
            },
            { icon: '🤖', label: 'AI Analysis', value: total > 0 ? 'Ready' : 'N/A', bg: '#fff7ed', valueColor: '#ea580c', valueSize: 16 },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: s.valueSize || 24, color: s.valueColor || 'var(--text)' }}>
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No responses yet */}
        {total === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-h">No responses yet</div>
            <p className="empty-p">Share the form link to start collecting responses.</p>
            <button className="btn btn-primary" onClick={() => window.open(`/form/${id}`, '_blank')}>
              Preview Form →
            </button>
          </div>
        ) : (
          <>
            {/* AI Summary */}
            <div className="ai-card">
              <div className="ai-badge">🤖 AI Summary</div>
              <div className="ai-text">
                {summary?.ai_summary || 'Summary not available.'}
              </div>
            </div>

            {/* Per-question results */}
            {(form.questions || []).map((q, i) => {
              const s = summary?.stats?.[q.id]
              return (
                <div className="q-result-card" key={q.id}>
                  <div className="qr-header">
                    <div className="qr-header-left">
                      <div className="qr-num">Question {i + 1}</div>
                      <div className="qr-q">{q.question || 'Untitled question'}</div>
                    </div>
                    <div className="qr-meta">
                      <span className="badge badge-purple">{TYPE_LABELS[q.type] || q.type}</span>
                      <span className="badge badge-green">{s?.total || 0} response{s?.total !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {!s || s.total === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>No responses for this question.</p>
                  ) : (
                    <QuestionResult q={q} s={s} color={color} />
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}

/* ── Question result renderers ─────────────────────────────────────── */
function QuestionResult({ q, s, color }) {
  if (['mcq', 'checkbox', 'dropdown', 'true_false'].includes(q.type)) {
    return <BarResult s={s} color={color} />
  }
  if (q.type === 'rating') {
    return <RatingResult s={s} />
  }
  if (q.type === 'date') {
    return (
      <div className="date-chips">
        {(s.answers || []).map((a, i) => <span key={i} className="date-chip">📅 {a}</span>)}
      </div>
    )
  }
  // text / paragraph
  return (
    <div className="text-resps">
      {(s.answers || []).map((a, i) => <div key={i} className="text-resp">{a}</div>)}
    </div>
  )
}

function BarResult({ s, color }) {
  const labels = Object.keys(s.counts)
  const data   = Object.values(s.counts)
  const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])

  return (
    <div className="chart-wrap">
      <Bar
        data={{
          labels,
          datasets: [{
            data,
            backgroundColor: colors.map(c => c + 'cc'),
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const pct = Math.round((ctx.raw / s.total) * 100)
                  return ` ${ctx.raw} responses (${pct}%)`
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#64748b' } },
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter', size: 12 }, color: '#64748b' }, grid: { color: '#f1f5f9' } },
          },
        }}
      />
    </div>
  )
}

function RatingResult({ s }) {
  const avg  = s.average || 0
  const dist = s.distribution || {}
  const max  = Math.max(...Object.values(dist), 1)

  return (
    <div className="rating-display">
      <div>
        <div className="rating-avg">{avg}</div>
        <div className="rating-stars-row">
          {[1,2,3,4,5].map(n => (
            <span key={n} className={`rating-star ${n <= Math.round(avg) ? 'on' : 'off'}`}>★</span>
          ))}
        </div>
        <div className="rating-count">{s.total} rating{s.total !== 1 ? 's' : ''}</div>
      </div>
      <div className="rating-dist">
        {[5,4,3,2,1].map(n => {
          const cnt = dist[n] || 0
          const pct = Math.round((cnt / max) * 100)
          return (
            <div key={n} className="dist-row">
              <div className="dist-lbl">{n}★</div>
              <div className="dist-bar-bg"><div className="dist-bar-fill" style={{ width: `${pct}%` }} /></div>
              <div className="dist-cnt">{cnt}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

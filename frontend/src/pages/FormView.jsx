import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function FormView() {
  const { id } = useParams()
  const nav    = useNavigate()

  const [form,      setForm]      = useState(null)
  const [answers,   setAnswers]   = useState({})
  const [errors,    setErrors]    = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [hoverStar, setHoverStar] = useState({})

  useEffect(() => {
    api.getForm(id)
      .then(f => { setForm(f); document.title = `${f.title} — FormCraft` })
      .catch(() => setForm(null))
      .finally(() => setLoading(false))
  }, [id])

  /* ── progress % ── */
  const progress = (() => {
    if (!form?.questions?.length) return 0
    const answered = form.questions.filter(q => {
      const a = answers[q.id]
      return Array.isArray(a) ? a.length > 0 : (a !== undefined && a !== '')
    }).length
    return Math.round((answered / form.questions.length) * 100)
  })()

  /* ── answer helpers ── */
  const setAns = (qid, val) => setAnswers(p => ({ ...p, [qid]: val }))

  const toggleCheck = (qid, opt) => {
    const cur = Array.isArray(answers[qid]) ? answers[qid] : []
    setAns(qid, cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt])
  }

  /* ── submit ── */
  const submit = async () => {
    const errs = {}
    form.questions.forEach(q => {
      if (!q.required) return
      const a = answers[q.id]
      if (a === undefined || a === '' || (Array.isArray(a) && !a.length)) {
        errs[q.id] = 'This question is required'
      }
    })
    setErrors(errs)
    if (Object.keys(errs).length) {
      const firstId = form.questions.find(q => errs[q.id])?.id
      if (firstId) document.getElementById(`q_${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      await api.submitResponse(id, answers)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      alert('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── guards ── */
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
      <div className="spinner" style={{ fontSize: 32 }}>⏳</div>
      <p style={{ marginTop: 12 }}>Loading form…</p>
    </div>
  )

  if (!form) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <h2 style={{ marginBottom: 8 }}>Form not found</h2>
      <button className="btn btn-primary" onClick={() => nav('/')}>Go to Dashboard</button>
    </div>
  )

  if (!form.accepting_responses) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
      <h2 style={{ marginBottom: 8 }}>Form is Closed</h2>
      <p style={{ color: 'var(--muted)' }}>This form is no longer accepting responses.</p>
    </div>
  )

  const color = form.theme_color || '#6366f1'

  if (submitted) return (
    <div className="fv-wrap">
      <div className="thankyou">
        <div className="ty-icon">🎉</div>
        <div className="ty-title">Response Submitted!</div>
        <div className="ty-sub">Thank you for taking the time to fill out this form.</div>
        <button className="btn btn-primary" onClick={() => { setAnswers({}); setSubmitted(false) }}>
          Submit Another Response
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* progress bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
      </div>

      <div className="fv-wrap">
        {/* header */}
        <div className="fv-header">
          <div className="fv-header-banner" style={{ background: color }} />
          <div className="fv-header-body">
            <div className="fv-title">{form.title}</div>
            {form.description && <div className="fv-desc">{form.description}</div>}
            {form.questions.some(q => q.required) && (
              <div className="fv-req-note">
                <span style={{ color: 'var(--err)', fontSize: 14 }}>*</span> Required questions
              </div>
            )}
          </div>
        </div>

        {/* questions */}
        {(form.questions || []).map((q, i) => (
          <div
            key={q.id}
            id={`q_${q.id}`}
            className={`fv-q ${errors[q.id] ? 'has-error' : ''}`}
          >
            <div className="fv-q-num">Question {i + 1}</div>
            <div className="fv-q-label">
              {q.question || 'Untitled question'}
              {q.required && <span className="req">*</span>}
            </div>

            {/* Short answer */}
            {q.type === 'text' && (
              <input
                className={`input ${errors[q.id] ? 'error' : ''}`}
                placeholder="Your answer"
                value={answers[q.id] || ''}
                onChange={e => { setAns(q.id, e.target.value); setErrors(p => ({ ...p, [q.id]: null })) }}
              />
            )}

            {/* Paragraph */}
            {q.type === 'paragraph' && (
              <textarea
                className={`input ${errors[q.id] ? 'error' : ''}`}
                placeholder="Your answer"
                rows={4}
                value={answers[q.id] || ''}
                onChange={e => { setAns(q.id, e.target.value); setErrors(p => ({ ...p, [q.id]: null })) }}
              />
            )}

            {/* MCQ */}
            {q.type === 'mcq' && (
              <div className="fv-opts">
                {(q.options || []).map((opt, oi) => (
                  <div
                    key={oi}
                    className={`fv-opt ${answers[q.id] === opt ? 'selected' : ''}`}
                    onClick={() => { setAns(q.id, opt); setErrors(p => ({ ...p, [q.id]: null })) }}
                  >
                    <input type="radio" readOnly checked={answers[q.id] === opt} />
                    <span className="fv-opt-label">{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Checkboxes */}
            {q.type === 'checkbox' && (
              <div className="fv-opts">
                {(q.options || []).map((opt, oi) => {
                  const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt)
                  return (
                    <div
                      key={oi}
                      className={`fv-opt ${checked ? 'selected' : ''}`}
                      onClick={() => { toggleCheck(q.id, opt); setErrors(p => ({ ...p, [q.id]: null })) }}
                    >
                      <input type="checkbox" readOnly checked={checked} />
                      <span className="fv-opt-label">{opt}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Dropdown */}
            {q.type === 'dropdown' && (
              <select
                className={`input select ${errors[q.id] ? 'error' : ''}`}
                value={answers[q.id] || ''}
                onChange={e => { setAns(q.id, e.target.value); setErrors(p => ({ ...p, [q.id]: null })) }}
              >
                <option value="">— Choose an option —</option>
                {(q.options || []).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
              </select>
            )}

            {/* True / False */}
            {q.type === 'true_false' && (
              <div className="tf-wrap">
                {['True', 'False'].map(v => (
                  <div
                    key={v}
                    className={`tf-option t-${v.toLowerCase()} ${answers[q.id] === v ? 'selected' : ''}`}
                    onClick={() => { setAns(q.id, v); setErrors(p => ({ ...p, [q.id]: null })) }}
                  >
                    {v === 'True' ? '✓ True' : '✗ False'}
                  </div>
                ))}
              </div>
            )}

            {/* Rating */}
            {q.type === 'rating' && (
              <div>
                <div className="stars-wrap">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span
                      key={n}
                      className={`star ${n <= (hoverStar[q.id] ?? answers[q.id] ?? 0) ? 'filled' : ''}`}
                      onMouseEnter={() => setHoverStar(p => ({ ...p, [q.id]: n }))}
                      onMouseLeave={() => setHoverStar(p => ({ ...p, [q.id]: null }))}
                      onClick={() => { setAns(q.id, n); setErrors(p => ({ ...p, [q.id]: null })) }}
                    >★</span>
                  ))}
                </div>
                <div className="star-label">
                  {answers[q.id] ? `${answers[q.id]} out of 5 stars` : 'Click to rate'}
                </div>
              </div>
            )}

            {/* Date */}
            {q.type === 'date' && (
              <input
                type="date"
                className={`input ${errors[q.id] ? 'error' : ''}`}
                style={{ maxWidth: 220 }}
                value={answers[q.id] || ''}
                onChange={e => { setAns(q.id, e.target.value); setErrors(p => ({ ...p, [q.id]: null })) }}
              />
            )}

            {/* Error message */}
            {errors[q.id] && (
              <div className="fv-error">⚠ {errors[q.id]}</div>
            )}
          </div>
        ))}

        {/* Submit */}
        <div className="fv-submit">
          <button
            style={{ background: color }}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? '⏳ Submitting…' : 'Submit Response →'}
          </button>
        </div>
      </div>
    </>
  )
}

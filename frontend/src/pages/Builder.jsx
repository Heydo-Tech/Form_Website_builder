import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableQuestion from '../components/SortableQuestion'
import { api } from '../api'
import { useToast } from '../context/ToastContext'

const TYPE_LABELS = {
  text:'Short Answer', paragraph:'Paragraph', mcq:'Multiple Choice',
  checkbox:'Checkboxes', dropdown:'Dropdown', true_false:'True / False',
  rating:'Rating (1–5)', date:'Date',
}

const TYPE_TILES = [
  { type:'text',       icon:'💬', label:'Short Answer'   },
  { type:'paragraph',  icon:'📝', label:'Paragraph'      },
  { type:'mcq',        icon:'🔘', label:'Multiple Choice' },
  { type:'checkbox',   icon:'☑️',  label:'Checkboxes'     },
  { type:'dropdown',   icon:'📋', label:'Dropdown'       },
  { type:'true_false', icon:'⚖️', label:'True / False'  },
  { type:'rating',     icon:'⭐', label:'Rating'         },
  { type:'date',       icon:'📅', label:'Date'           },
]

const NEW_FORM = { title: '', description: '', questions: [], theme_color: '#6366f1', accepting_responses: true }

export default function Builder() {
  const { id }  = useParams()
  const nav     = useNavigate()
  const toast   = useToast()

  const [form,       setForm]       = useState(NEW_FORM)
  const [selectedId, setSelectedId] = useState(null)
  const [dirty,      setDirty]      = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [typePicker, setTypePicker] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  /* load form */
  useEffect(() => {
    if (!id) return
    api.getForm(id).then(f => {
      setForm(f)
      setDirty(false)
    }).catch(() => toast('Form not found', 'error'))
  }, [id])

  /* Cmd/Ctrl+S to save */
  useEffect(() => {
    const handler = e => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [form])

  /* warn on unload if dirty */
  useEffect(() => {
    const handler = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const setF = (updates) => {
    setForm(p => ({ ...p, ...updates }))
    setDirty(true)
  }

  /* save */
  const save = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const payload = { ...form, title: form.title || 'Untitled Form' }
      const saved   = form.id ? await api.updateForm(form.id, payload) : await api.createForm(payload)
      setForm(saved)
      setDirty(false)
      if (!form.id) nav(`/builder/${saved.id}`, { replace: true })
      toast('✓ Saved!', 'success')
    } catch { toast('Save failed', 'error') }
    finally  { setSaving(false) }
  }, [form, saving])

  /* question operations */
  const addQuestion = (type) => {
    const q = {
      id: 'q_' + Date.now(),
      type,
      question: '',
      required: false,
      options: ['mcq', 'checkbox', 'dropdown'].includes(type) ? ['Option 1', 'Option 2'] : [],
    }
    setForm(p => ({ ...p, questions: [...p.questions, q] }))
    setSelectedId(q.id)
    setTypePicker(false)
    setDirty(true)
  }

  const updateQuestion = (id, updates) => {
    setForm(p => ({ ...p, questions: p.questions.map(q => q.id === id ? { ...q, ...updates } : q) }))
    setDirty(true)
  }

  const deleteQuestion = (id) => {
    setForm(p => ({ ...p, questions: p.questions.filter(q => q.id !== id) }))
    setSelectedId(p => p === id ? null : p)
    setDirty(true)
  }

  const duplicateQuestion = (id) => {
    setForm(p => {
      const idx  = p.questions.findIndex(q => q.id === id)
      const copy = { ...JSON.parse(JSON.stringify(p.questions[idx])), id: 'q_' + Date.now() }
      const qs   = [...p.questions]
      qs.splice(idx + 1, 0, copy)
      setSelectedId(copy.id)
      return { ...p, questions: qs }
    })
    setDirty(true)
  }

  /* drag & drop */
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setForm(p => {
      const from = p.questions.findIndex(q => q.id === active.id)
      const to   = p.questions.findIndex(q => q.id === over.id)
      return { ...p, questions: arrayMove(p.questions, from, to) }
    })
    setDirty(true)
  }

  const color = form.theme_color || '#6366f1'

  return (
    <>
      {/* TOP BAR */}
      <div className="builder-topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/')}>← Back</button>
        <input
          className="builder-title-input"
          value={form.title}
          placeholder="Untitled Form"
          onChange={e => setF({ title: e.target.value })}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label className="toggle-wrap" style={{ gap: 7 }}>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.accepting_responses !== false}
                onChange={e => setF({ accepting_responses: e.target.checked })}
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
            <span style={{ fontSize: 12 }}>Accepting</span>
          </label>
          <span className={`save-status ${!dirty ? 'ok' : ''}`}>
            {saving ? '⏳ Saving…' : dirty ? '● Unsaved' : '✓ Saved'}
          </span>
          {form.id && (
            <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/form/${form.id}`, '_blank')}>
              👁 Preview
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? '…' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="builder-body">
        {/* Form header card */}
        <div className="form-header-card" style={{ borderTopColor: color }}>
          <input
            className="fh-title"
            placeholder="Form Title"
            value={form.title}
            onChange={e => setF({ title: e.target.value })}
          />
          <textarea
            className="fh-desc"
            placeholder="Form description (optional)…"
            value={form.description}
            onChange={e => setF({ description: e.target.value })}
            rows={2}
          />
        </div>

        {/* Questions */}
        {form.questions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--card)', borderRadius: 'var(--r)', border: '2px dashed var(--border)', marginBottom: 14, color: 'var(--muted)', fontSize: 14 }}>
            No questions yet — click <strong>+ Add Question</strong> to get started.
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={form.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            {form.questions.map((q, i) => (
              <SortableQuestion
                key={q.id}
                question={q}
                index={i}
                isSelected={selectedId === q.id}
                onSelect={setSelectedId}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
                onDuplicate={duplicateQuestion}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add question button */}
        <div className="add-q-wrap">
          <button className="add-q-btn" onClick={() => setTypePicker(true)}>＋ Add Question</button>
        </div>
      </div>

      {/* TYPE PICKER MODAL */}
      {typePicker && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setTypePicker(false)}>
          <div className="modal modal-lg">
            <div className="modal-title" style={{ textAlign: 'center' }}>Choose Question Type</div>
            <div className="type-grid">
              {TYPE_TILES.map(t => (
                <div key={t.type} className="type-tile" onClick={() => addQuestion(t.type)}>
                  <div className="t-icon">{t.icon}</div>
                  <div className="t-label">{t.label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setTypePicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

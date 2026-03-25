import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const TYPE_LABELS = {
  text: 'Short Answer', paragraph: 'Paragraph', mcq: 'Multiple Choice',
  checkbox: 'Checkboxes', dropdown: 'Dropdown', true_false: 'True / False',
  rating: 'Rating (1–5)', date: 'Date',
}

export default function SortableQuestion({ question, index, isSelected, onSelect, onUpdate, onDelete, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`q-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={() => onSelect(question.id)}
    >
      <div className="drag-handle" {...attributes} {...listeners} onClick={e => e.stopPropagation()}>⠿</div>
      <div className="q-card-inner">
        {isSelected
          ? <Editor q={question} onUpdate={onUpdate} onDelete={onDelete} onDuplicate={onDuplicate} />
          : <Preview q={question} index={index} />}
      </div>
    </div>
  )
}

/* ── PREVIEW (collapsed) ───────────────────────────────────────────── */
function Preview({ q, index }) {
  const hasOptions = ['mcq', 'checkbox', 'dropdown'].includes(q.type)
  return (
    <div className="q-preview">
      <div className="q-preview-number">Question {index + 1}</div>
      <div className="q-preview-label">
        <span>{q.question || <em style={{ color: '#94a3b8' }}>Untitled question</em>}</span>
        {q.required && <span className="q-req-star">*</span>}
        <span className="q-type-pill">{TYPE_LABELS[q.type]}</span>
      </div>

      {q.type === 'text' && <div className="q-fake-input" />}
      {q.type === 'paragraph' && <div className="q-fake-textarea" />}
      {q.type === 'date' && <div className="q-fake-input" style={{ maxWidth: 160 }} />}
      {q.type === 'rating' && <div className="q-fake-stars">★★★★★</div>}
      {q.type === 'true_false' && (
        <div className="tf-preview">
          <span className="tf-chip tf-true">✓ True</span>
          <span className="tf-chip tf-false">✗ False</span>
        </div>
      )}
      {hasOptions && (q.options || []).map((o, i) => (
        <div key={i} className="q-fake-option">
          <div className={`q-fake-radio ${q.type === 'checkbox' ? 'q-fake-check' : ''}`} />
          <span>{o}</span>
        </div>
      ))}
      {q.type === 'dropdown' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
          <span>▼</span> {(q.options || []).length} options
        </div>
      )}
    </div>
  )
}

/* ── EDITOR (expanded) ─────────────────────────────────────────────── */
function Editor({ q, onUpdate, onDelete, onDuplicate }) {
  const hasOptions = ['mcq', 'checkbox', 'dropdown'].includes(q.type)

  const handleTypeChange = (newType) => {
    const updates = { type: newType }
    if (['mcq', 'checkbox', 'dropdown'].includes(newType) && !(q.options?.length)) {
      updates.options = ['Option 1', 'Option 2']
    }
    if (!['mcq', 'checkbox', 'dropdown'].includes(newType)) {
      updates.options = []
    }
    onUpdate(q.id, updates)
  }

  const updateOption = (idx, val) => {
    const opts = [...(q.options || [])]
    opts[idx] = val
    onUpdate(q.id, { options: opts })
  }

  const addOption = () => onUpdate(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })

  const removeOption = (idx) => {
    if ((q.options || []).length <= 1) return
    onUpdate(q.id, { options: q.options.filter((_, i) => i !== idx) })
  }

  return (
    <div className="q-editor" onClick={e => e.stopPropagation()}>
      {/* Question text + type selector */}
      <div className="q-editor-row">
        <input
          className="input"
          value={q.question}
          placeholder="Enter your question"
          onChange={e => onUpdate(q.id, { question: e.target.value })}
          autoFocus
        />
        <select
          className="q-type-select"
          value={q.type}
          onChange={e => handleTypeChange(e.target.value)}
        >
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Options editor */}
      {hasOptions && (
        <>
          <div className="opts-list">
            {(q.options || []).map((o, i) => (
              <div key={i} className="opt-row">
                <div className={`opt-icon ${q.type === 'checkbox' ? 'check' : ''}`} />
                <input
                  className="opt-input"
                  value={o}
                  placeholder={`Option ${i + 1}`}
                  onChange={e => updateOption(i, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addOption()}
                />
                <button className="remove-opt" onClick={() => removeOption(i)} title="Remove">×</button>
              </div>
            ))}
          </div>
          <button className="add-opt-btn" onClick={addOption}>＋ Add option</button>
        </>
      )}

      {/* True/False preview */}
      {q.type === 'true_false' && (
        <div className="tf-preview mb-3">
          <span className="tf-chip tf-true">✓ True</span>
          <span className="tf-chip tf-false">✗ False</span>
        </div>
      )}

      {/* Rating preview */}
      {q.type === 'rating' && (
        <div style={{ marginBottom: 12 }}>
          <div className="q-fake-stars">★★★★★</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>1 = Worst &nbsp; 5 = Best</div>
        </div>
      )}

      {/* Date preview */}
      {q.type === 'date' && (
        <div className="mb-3">
          <input type="date" className="input" style={{ maxWidth: 200 }} disabled />
        </div>
      )}

      {/* Footer: duplicate / delete / required */}
      <div className="q-editor-footer">
        <div className="q-footer-actions">
          <button className="dup-btn" onClick={() => onDuplicate(q.id)}>⧉ Duplicate</button>
          <button className="del-btn" onClick={() => onDelete(q.id)}>🗑 Delete</button>
        </div>
        <label className="toggle-wrap" onClick={e => e.stopPropagation()}>
          <label className="toggle">
            <input type="checkbox" checked={q.required} onChange={e => onUpdate(q.id, { required: e.target.checked })} />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
          Required
        </label>
      </div>
    </div>
  )
}

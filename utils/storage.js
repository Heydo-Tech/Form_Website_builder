const fs   = require('fs')
const path = require('path')

const STORAGE_ROOT  = path.join(__dirname, '../storage')
const FORMS_DIR     = path.join(STORAGE_ROOT, 'forms')
const RESPONSES_DIR = path.join(STORAGE_ROOT, 'responses')

// Ensure directories exist on module load
fs.mkdirSync(FORMS_DIR,     { recursive: true })
fs.mkdirSync(RESPONSES_DIR, { recursive: true })

/* ── helpers ─────────────────────────────────────────────────────── */
const readJSON  = (p)    => JSON.parse(fs.readFileSync(p, 'utf8'))
const writeJSON = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2))

/* ── forms ───────────────────────────────────────────────────────── */
function formPath(id)     { return path.join(FORMS_DIR, `${id}.json`) }
function responsePath(id) { return path.join(RESPONSES_DIR, `${id}.json`) }

const loadForm = (id) => {
  const p = formPath(id)
  return fs.existsSync(p) ? readJSON(p) : null
}

const saveForm = (form) => writeJSON(formPath(form.id), form)

const listForms = () =>
  fs.readdirSync(FORMS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => readJSON(path.join(FORMS_DIR, f)))

const deleteForm = (id) => {
  const fp = formPath(id)
  const rp = responsePath(id)
  if (fs.existsSync(fp)) fs.unlinkSync(fp)
  if (fs.existsSync(rp)) fs.unlinkSync(rp)
}

/* ── responses ───────────────────────────────────────────────────── */
const loadResponses = (id) => {
  const p = responsePath(id)
  return fs.existsSync(p) ? readJSON(p) : []
}

const saveResponses = (id, data) => writeJSON(responsePath(id), data)

module.exports = { loadForm, saveForm, listForms, deleteForm, loadResponses, saveResponses }

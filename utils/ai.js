const axios = require('axios')

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate'
const MODEL      = process.env.MODEL      || 'llama3'

/**
 * Build per-question stats from raw responses.
 */
function buildStats(form, responses) {
  const stats = {}

  for (const q of (form.questions || [])) {
    const { id: qid, type: qtype } = q
    const raw = responses
      .map(r => r.answers[qid])
      .filter(a => a !== undefined && a !== null && a !== '')

    if (!raw.length) continue

    if (['mcq', 'dropdown', 'true_false'].includes(qtype)) {
      const counts = {}
      raw.forEach(a => { counts[String(a)] = (counts[String(a)] || 0) + 1 })
      stats[qid] = { type: qtype, question: q.question, counts, total: raw.length }

    } else if (qtype === 'checkbox') {
      const counts = {}
      raw.forEach(a => {
        const items = Array.isArray(a) ? a : [a]
        items.forEach(item => { counts[String(item)] = (counts[String(item)] || 0) + 1 })
      })
      stats[qid] = { type: qtype, question: q.question, counts, total: raw.length }

    } else if (['text', 'paragraph'].includes(qtype)) {
      stats[qid] = { type: qtype, question: q.question, answers: raw, total: raw.length }

    } else if (qtype === 'rating') {
      const nums = raw.map(a => parseInt(a)).filter(n => !isNaN(n))
      const avg  = nums.length
        ? +(nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1)
        : 0
      const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      nums.forEach(n => { if (distribution[String(n)] !== undefined) distribution[String(n)]++ })
      stats[qid] = { type: qtype, question: q.question, average: avg, distribution, total: nums.length }

    } else if (qtype === 'date') {
      stats[qid] = { type: qtype, question: q.question, answers: raw.slice(0, 20), total: raw.length }
    }
  }

  return stats
}

/**
 * Ask Ollama for a concise AI summary of the form results.
 */
async function getAISummary(form, responses, stats) {
  const lines = [`Form: "${form.title}"`, `Total responses: ${responses.length}`, '']

  for (const q of (form.questions || [])) {
    const s = stats[q.id]
    if (!s) continue
    lines.push(`Q: ${q.question}`)
    if (['mcq', 'dropdown', 'true_false', 'checkbox'].includes(s.type)) {
      lines.push('Results: ' + Object.entries(s.counts).map(([k, v]) => `${k}: ${v}`).join(', '))
    } else if (['text', 'paragraph'].includes(s.type)) {
      lines.push('Sample answers: ' + s.answers.slice(0, 4).join('; '))
    } else if (s.type === 'rating') {
      lines.push(`Average rating: ${s.average}/5`)
    }
    lines.push('')
  }

  const prompt =
    'Analyze these form responses. Write a concise 3-4 sentence summary ' +
    'highlighting key findings with specific numbers.\n\n' +
    lines.join('\n') + '\nSummary:'

  const { data } = await axios.post(
    OLLAMA_URL,
    { model: MODEL, prompt, stream: false },
    { timeout: 30000 }
  )
  return data.response.trim()
}

module.exports = { buildStats, getAISummary }

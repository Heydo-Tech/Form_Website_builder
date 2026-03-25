/**
 * seed_ai_sample.js
 *
 * Creates a "Remote Work & Productivity Survey" form with 10 question types
 * and 50 submissions designed for meaningful AI analysis.
 *
 * Key design choices for AI-friendliness:
 *  - 4 distinct user personas → correlated answer patterns across questions
 *  - Weighted distributions → realistic, non-uniform data
 *  - Temporal spread → submissions over the past 60 days
 *  - Rich, varied free-text responses drawn from persona-specific pools
 *
 * Run:  node scripts/seed_ai_sample.js
 */

const { saveForm, saveResponses } = require('../utils/storage')

/* ─── Form definition ────────────────────────────────────────────────── */

const FORM_ID = 'ai_sample_remote_work'

function createForm() {
  const now = new Date().toISOString()

  const form = {
    id: FORM_ID,
    title: 'Remote Work & Productivity Survey',
    description:
      'Help us understand how distributed teams work, what challenges they face, ' +
      'and what makes remote collaboration effective. Estimated time: 3 minutes.',
    theme_color: '#0ea5e9',
    accepting_responses: true,
    created_at: now,
    updated_at: now,
    questions: [
      // 1. rating (scale 10) – satisfaction
      {
        id: 'q1',
        type: 'rating',
        question: 'How satisfied are you with your overall remote work experience? (1 = very dissatisfied, 10 = very satisfied)',
        scale: 10,
      },
      // 2. mcq – tenure
      {
        id: 'q2',
        type: 'mcq',
        question: 'How long have you been working remotely?',
        options: [
          'Less than 6 months',
          '6–12 months',
          '1–2 years',
          '3–5 years',
          'More than 5 years',
        ],
      },
      // 3. dropdown – job function
      {
        id: 'q3',
        type: 'dropdown',
        question: 'What best describes your primary job function?',
        options: [
          'Engineering / Development',
          'Design / Creative',
          'Product / Project Management',
          'Sales / Marketing',
          'Customer Support',
          'Finance / Operations',
          'HR / People',
          'Other',
        ],
      },
      // 4. checkbox – tools used
      {
        id: 'q4',
        type: 'checkbox',
        question: 'Which collaboration tools do you use daily? (select all that apply)',
        options: [
          'Slack / Teams',
          'Zoom / Google Meet',
          'Notion / Confluence',
          'Jira / Linear',
          'GitHub / GitLab',
          'Figma / Miro',
          'Google Workspace',
          'Loom / async video',
        ],
      },
      // 5. text – biggest blocker
      {
        id: 'q5',
        type: 'text',
        question: 'What is your single biggest productivity blocker while working remotely?',
      },
      // 6. true_false – dedicated space
      {
        id: 'q6',
        type: 'true_false',
        question: 'Do you have a dedicated, distraction-free home office space?',
        options: ['Yes', 'No'],
      },
      // 7. rating (scale 5) – manager effectiveness
      {
        id: 'q7',
        type: 'rating',
        question: 'How effective is your manager at leading a remote team? (1 = poor, 5 = excellent)',
        scale: 5,
      },
      // 8. mcq – daily hours
      {
        id: 'q8',
        type: 'mcq',
        question: 'On average, how many hours per day do you work remotely?',
        options: [
          'Less than 6 hours',
          '6–7 hours',
          '8 hours',
          '9–10 hours',
          'More than 10 hours',
        ],
      },
      // 9. paragraph – ideal future
      {
        id: 'q9',
        type: 'paragraph',
        question:
          'Describe your ideal future-of-work arrangement. What would your perfect mix of remote, hybrid, and in-office look like?',
      },
      // 10. date – transition date
      {
        id: 'q10',
        type: 'date',
        question: 'When did you first transition to remote or hybrid work?',
      },
    ],
  }

  saveForm(form)
  return form
}

/* ─── Persona definitions ─────────────────────────────────────────────
 *
 *  A – "Thriving Remote Pro"    (35 %)  high satisfaction, long tenure, dedicated office
 *  B – "Struggling Newcomer"    (25 %)  low satisfaction, < 1 yr, no dedicated space
 *  C – "Balanced Mid-Career"    (25 %)  moderate satisfaction, 1–3 yrs experience
 *  D – "Burnt-out Senior"       (15 %)  was high-performer, now fatigued, overworks
 *
 * ─────────────────────────────────────────────────────────────────── */

const PERSONAS = {
  A: {
    label: 'Thriving Remote Pro',
    weight: 35,
    q1: () => rand(8, 10),
    q2: () => pick(['3–5 years', 'More than 5 years']),
    q3: () => pick(['Engineering / Development', 'Product / Project Management', 'Design / Creative']),
    q4: () => pickWeighted([
      ['Slack / Teams', 0.9], ['Zoom / Google Meet', 0.8], ['Notion / Confluence', 0.7],
      ['GitHub / GitLab', 0.6], ['Figma / Miro', 0.4], ['Google Workspace', 0.7],
      ['Jira / Linear', 0.5], ['Loom / async video', 0.5],
    ]),
    q5: () => pick([
      'Occasional internet outages disrupt video calls.',
      'Keeping team-wide meetings short enough to stay focused.',
      'Time-zone differences with overseas colleagues.',
      'Back-to-back virtual meetings leaving little deep-work time.',
      'Maintaining clear boundaries between work and personal time.',
    ]),
    q6: () => 'Yes',
    q7: () => rand(4, 5),
    q8: () => pick(['6–7 hours', '8 hours']),
    q9: () => pick([
      'I thrive fully remote and would like to keep it that way permanently. Occasional in-person offsites (quarterly) energize the team without the daily commute overhead.',
      'Full remote with optional in-person collaboration weeks a few times a year. I value the flexibility to work from anywhere while still meeting colleagues face-to-face.',
      'Async-first culture with one optional in-office day per week. No mandatory presence — results over attendance.',
      'Permanently remote with a generous home-office stipend and annual all-hands gathering. That is the sweet spot for focus and culture.',
    ]),
    q10: () => dateYearsAgo(3, 6),
  },

  B: {
    label: 'Struggling Newcomer',
    weight: 25,
    q1: () => rand(2, 5),
    q2: () => pick(['Less than 6 months', '6–12 months']),
    q3: () => pick(['Customer Support', 'Finance / Operations', 'Sales / Marketing', 'HR / People']),
    q4: () => pickWeighted([
      ['Slack / Teams', 0.7], ['Zoom / Google Meet', 0.8], ['Google Workspace', 0.6],
      ['Notion / Confluence', 0.2], ['Jira / Linear', 0.1], ['GitHub / GitLab', 0.1],
      ['Figma / Miro', 0.1], ['Loom / async video', 0.1],
    ]),
    q5: () => pick([
      'Feeling isolated and disconnected from the team — I miss spontaneous office chat.',
      'Distractions at home (kids, noise, chores) make it hard to focus.',
      'Unclear expectations and slow feedback cycles from my manager.',
      'No dedicated desk; working from the kitchen table hurts my posture and focus.',
      'Struggling to "switch off" — the laptop is always there.',
    ]),
    q6: () => 'No',
    q7: () => rand(1, 3),
    q8: () => pick(['8 hours', '9–10 hours', 'More than 10 hours']),
    q9: () => pick([
      'Honestly, I would prefer going back to the office most days. I need that structure and face-time to stay motivated and learn from colleagues.',
      'I would like a hybrid setup — 3 days in-office and 2 from home. Enough in-person time to feel connected but still some flexibility.',
      'If remote work continues I need the company to provide proper equipment and a co-working stipend so I have somewhere quiet to go.',
      'I struggle working from home right now; a 4-day in-office schedule with one remote day would work best for me.',
    ]),
    q10: () => dateMonthsAgo(1, 11),
  },

  C: {
    label: 'Balanced Mid-Career',
    weight: 25,
    q1: () => rand(6, 8),
    q2: () => pick(['1–2 years', '3–5 years']),
    q3: () => pick(['Engineering / Development', 'Design / Creative', 'Product / Project Management', 'Sales / Marketing']),
    q4: () => pickWeighted([
      ['Slack / Teams', 0.85], ['Zoom / Google Meet', 0.8], ['Notion / Confluence', 0.5],
      ['Jira / Linear', 0.5], ['GitHub / GitLab', 0.4], ['Figma / Miro', 0.35],
      ['Google Workspace', 0.65], ['Loom / async video', 0.3],
    ]),
    q5: () => pick([
      'Context-switching between too many communication channels (Slack, email, meetings).',
      'Getting timely decisions when key stakeholders are in different time zones.',
      'Onboarding new team members remotely takes much longer than in-person.',
      'Keeping documentation up to date so async collaboration actually works.',
      'Meeting fatigue — too many check-ins that could have been async updates.',
    ]),
    q6: () => pick(['Yes', 'Yes', 'No']),
    q7: () => rand(3, 5),
    q8: () => pick(['6–7 hours', '8 hours', '9–10 hours']),
    q9: () => pick([
      'A 2–3 days remote / 2 days in-office hybrid would suit me best. I value focused remote days for deep work and in-person days for brainstorming and 1-on-1s.',
      'Flexible hybrid — I choose which days to come in based on what I need to accomplish that week. Autonomy is key.',
      'Remote-first with a well-equipped shared office available whenever I need it. No mandated days, but a great space when I want human contact.',
      'About 60 % remote and 40 % in-person. Monthly team sprints in the office keep alignment, the rest of the time async-first remote.',
    ]),
    q10: () => dateMonthsAgo(12, 36),
  },

  D: {
    label: 'Burnt-out Senior',
    weight: 15,
    q1: () => rand(3, 6),
    q2: () => pick(['3–5 years', 'More than 5 years']),
    q3: () => pick(['Engineering / Development', 'Product / Project Management', 'Finance / Operations']),
    q4: () => pickWeighted([
      ['Slack / Teams', 0.95], ['Zoom / Google Meet', 0.9], ['Notion / Confluence', 0.7],
      ['Jira / Linear', 0.6], ['GitHub / GitLab', 0.5], ['Figma / Miro', 0.3],
      ['Google Workspace', 0.8], ['Loom / async video', 0.4],
    ]),
    q5: () => pick([
      'Always-on expectation — messages arrive at all hours and I feel pressure to respond immediately.',
      'The line between work and personal life has completely disappeared.',
      'Too many tools, too many notifications — constant context switching drains me.',
      'Leadership keeps adding meetings instead of trusting async communication.',
      'Lack of clear work-hours policy means I am effectively working 60-hour weeks.',
    ]),
    q6: () => pick(['Yes', 'No']),
    q7: () => rand(2, 4),
    q8: () => pick(['9–10 hours', 'More than 10 hours']),
    q9: () => pick([
      'Honestly, I need the company to enforce hard stop times and a "right to disconnect" policy before I can answer this. The arrangement does not matter if the culture is always-on.',
      'Shorter work days with protected focus blocks. I would accept any ratio of remote/office if we fixed the culture of constant interruption first.',
      'Fully remote but with strict no-meeting Wednesdays and an explicit expectation that Slack is not a real-time medium.',
      'Remote with strong async norms — no reply expected after 6 PM, no weekend messages, real PTO. That would restore my enthusiasm for remote work.',
    ]),
    q10: () => dateYearsAgo(3, 7),
  },
}

/* ─── Helper utilities ───────────────────────────────────────────────── */

function rand(min, max) {
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Pick items from a weighted probability list [ [item, prob], ... ] */
function pickWeighted(weightedPairs) {
  return weightedPairs.filter(([, prob]) => Math.random() < prob).map(([item]) => item)
}

/** Random date between daysAgo=low and daysAgo=high */
function dateMonthsAgo(minMonths, maxMonths) {
  const msPerMonth = 30 * 24 * 60 * 60 * 1000
  const offset = (minMonths + Math.random() * (maxMonths - minMonths)) * msPerMonth
  return new Date(Date.now() - offset).toISOString().slice(0, 10)
}

function dateYearsAgo(minYears, maxYears) {
  return dateMonthsAgo(minYears * 12, maxYears * 12)
}

/** Random ISO timestamp within the last 60 days */
function randomSubmittedAt() {
  const offset = Math.random() * 60 * 24 * 60 * 60 * 1000
  return new Date(Date.now() - offset).toISOString()
}

/** Select a persona based on weights */
function selectPersona() {
  const totalWeight = Object.values(PERSONAS).reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * totalWeight
  for (const [key, persona] of Object.entries(PERSONAS)) {
    r -= persona.weight
    if (r <= 0) return [key, persona]
  }
  const entries = Object.entries(PERSONAS)
  return entries[entries.length - 1]
}

/* ─── Response generation ─────────────────────────────────────────────── */

function createResponses(form, count = 50) {
  const responses = []

  for (let i = 0; i < count; i++) {
    const [personaKey, persona] = selectPersona()
    const submitted_at = randomSubmittedAt()

    const answers = {
      q1:  persona.q1(),
      q2:  persona.q2(),
      q3:  persona.q3(),
      q4:  persona.q4(),
      q5:  persona.q5(),
      q6:  persona.q6(),
      q7:  persona.q7(),
      q8:  persona.q8(),
      q9:  persona.q9(),
      q10: persona.q10(),
    }

    responses.push({
      id: `r_${String(i + 1).padStart(3, '0')}`,
      submitted_at,
      _persona: personaKey,               // metadata tag — useful for AI ground-truth analysis
      answers,
    })
  }

  // Sort chronologically so AI time-series analysis is straightforward
  responses.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
  // Re-sequence IDs after sort
  responses.forEach((r, idx) => { r.id = `r_${String(idx + 1).padStart(3, '0')}` })

  saveResponses(form.id, responses)
  return responses
}

/* ─── Entry point ────────────────────────────────────────────────────── */

function main() {
  const form = createForm()
  const responses = createResponses(form, 50)

  // Summary for verification
  const counts = { A: 0, B: 0, C: 0, D: 0 }
  responses.forEach(r => counts[r._persona]++)

  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║         AI Sample Form — Seed Complete            ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`\n  Form   : "${form.title}"`)
  console.log(`  ID     : ${form.id}`)
  console.log(`  Questions: ${form.questions.length}`)
  console.log(`\n  Responses generated: ${responses.length}`)
  console.log(`    Persona A – Thriving Remote Pro  : ${counts.A}`)
  console.log(`    Persona B – Struggling Newcomer  : ${counts.B}`)
  console.log(`    Persona C – Balanced Mid-Career  : ${counts.C}`)
  console.log(`    Persona D – Burnt-out Senior     : ${counts.D}`)
  console.log(`\n  Stored at:`)
  console.log(`    storage/forms/${form.id}.json`)
  console.log(`    storage/responses/${form.id}.json`)
  console.log('\n  Open the FormBuilder UI → Responses → AI Analysis tab to explore.\n')
}

main()

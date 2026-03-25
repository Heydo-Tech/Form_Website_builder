/**
 * HardcodedAISampleResults.jsx
 *
 * Static results page for "Remote Work & Productivity Survey"
 * (form id: ai_sample_remote_work, 50 responses).
 *
 * All data is baked-in — no API call needed.
 * Route: /results/ai-sample
 */

import { useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const CHART_COLORS = [
  '#6366f1','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#8b5cf6','#ef4444','#06b6d4',
]

/* ── Static data ─────────────────────────────────────────────────────── */

const FORM = {
  id: 'ai_sample_remote_work',
  title: 'Remote Work & Productivity Survey',
  description:
    'Help us understand how distributed teams work, what challenges they face, ' +
    'and what makes remote collaboration effective.',
  theme_color: '#0ea5e9',
  questions: [
    { id: 'q1',  type: 'rating',    scale: 10, question: 'How satisfied are you with your overall remote work experience? (1 = very dissatisfied, 10 = very satisfied)' },
    { id: 'q2',  type: 'mcq',                  question: 'How long have you been working remotely?' },
    { id: 'q3',  type: 'dropdown',              question: 'What best describes your primary job function?' },
    { id: 'q4',  type: 'checkbox',              question: 'Which collaboration tools do you use daily? (select all that apply)' },
    { id: 'q5',  type: 'text',                  question: 'What is your single biggest productivity blocker while working remotely?' },
    { id: 'q6',  type: 'true_false',            question: 'Do you have a dedicated, distraction-free home office space?' },
    { id: 'q7',  type: 'rating',    scale: 5,   question: 'How effective is your manager at leading a remote team? (1 = poor, 5 = excellent)' },
    { id: 'q8',  type: 'mcq',                   question: 'On average, how many hours per day do you work remotely?' },
    { id: 'q9',  type: 'paragraph',             question: 'Describe your ideal future-of-work arrangement. What would your perfect mix of remote, hybrid, and in-office look like?' },
    { id: 'q10', type: 'date',                  question: 'When did you first transition to remote or hybrid work?' },
  ],
}

const STATS = {
  q1: {
    total: 50,
    average: 6.7,
    scale: 10,
    distribution: { 2:2, 3:4, 4:7, 5:2, 6:9, 7:3, 8:8, 9:9, 10:6 },
  },
  q2: {
    total: 50,
    counts: {
      '3–5 years': 16,
      'More than 5 years': 14,
      '6–12 months': 8,
      '1–2 years': 7,
      'Less than 6 months': 5,
    },
  },
  q3: {
    total: 50,
    counts: {
      'Engineering / Development': 14,
      'Product / Project Management': 11,
      'Design / Creative': 9,
      'Sales / Marketing': 5,
      'Customer Support': 4,
      'Finance / Operations': 4,
      'HR / People': 3,
    },
  },
  q4: {
    total: 50,
    counts: {
      'Zoom / Google Meet': 42,
      'Slack / Teams': 41,
      'Google Workspace': 30,
      'Notion / Confluence': 25,
      'Loom / async video': 23,
      'GitHub / GitLab': 19,
      'Jira / Linear': 19,
      'Figma / Miro': 17,
    },
  },
  q5: {
    total: 50,
    answers: [
      'Keeping team-wide meetings short enough to stay focused.',
      'Time-zone differences with overseas colleagues.',
      'Onboarding new team members remotely takes much longer than in-person.',
      'Maintaining clear boundaries between work and personal time.',
      'Distractions at home (kids, noise, chores) make it hard to focus.',
      'Struggling to "switch off" — the laptop is always there.',
      'Back-to-back virtual meetings leaving little deep-work time.',
      'Keeping documentation up to date so async collaboration actually works.',
      'No dedicated desk; working from the kitchen table hurts my posture and focus.',
      'Context-switching between too many communication channels (Slack, email, meetings).',
      'Meeting fatigue — too many check-ins that could have been async updates.',
      'Too many tools, too many notifications — constant context switching drains me.',
      'Unclear expectations and slow feedback cycles from my manager.',
      'Feeling isolated and disconnected from the team — I miss spontaneous office chat.',
      'Always-on expectation — messages arrive at all hours and I feel pressure to respond immediately.',
      'Leadership keeps adding meetings instead of trusting async communication.',
      'Getting timely decisions when key stakeholders are in different time zones.',
      'Occasional internet outages disrupt video calls.',
    ],
  },
  q6: {
    total: 50,
    counts: { 'Yes': 29, 'No': 21 },
  },
  q7: {
    total: 50,
    average: 3.5,
    scale: 5,
    distribution: { 1:6, 2:6, 3:11, 4:12, 5:15 },
  },
  q8: {
    total: 50,
    counts: {
      '8 hours': 15,
      '6–7 hours': 15,
      '9–10 hours': 11,
      'More than 10 hours': 9,
    },
  },
  q9: {
    total: 50,
    answers: [
      'I thrive fully remote and would like to keep it that way permanently. Occasional in-person offsites (quarterly) energize the team without the daily commute overhead.',
      'Full remote with optional in-person collaboration weeks a few times a year. I value the flexibility to work from anywhere while still meeting colleagues face-to-face.',
      'Async-first culture with one optional in-office day per week. No mandatory presence — results over attendance.',
      'Permanently remote with a generous home-office stipend and annual all-hands gathering. That is the sweet spot for focus and culture.',
      'A 2–3 days remote / 2 days in-office hybrid would suit me best. I value focused remote days for deep work and in-person days for brainstorming and 1-on-1s.',
      'Flexible hybrid — I choose which days to come in based on what I need to accomplish that week. Autonomy is key.',
      'Remote-first with a well-equipped shared office available whenever I need it. No mandated days, but a great space when I want human contact.',
      'About 60 % remote and 40 % in-person. Monthly team sprints in the office keep alignment, the rest of the time async-first remote.',
      'Honestly, I would prefer going back to the office most days. I need that structure and face-time to stay motivated and learn from colleagues.',
      'I would like a hybrid setup — 3 days in-office and 2 from home. Enough in-person time to feel connected but still some flexibility.',
      'If remote work continues I need the company to provide proper equipment and a co-working stipend so I have somewhere quiet to go.',
      'I struggle working from home right now; a 4-day in-office schedule with one remote day would work best for me.',
      'Fully remote but with strict no-meeting Wednesdays and an explicit expectation that Slack is not a real-time medium.',
      'Shorter work days with protected focus blocks. I would accept any ratio of remote/office if we fixed the culture of constant interruption first.',
      'Honestly, I need the company to enforce hard stop times and a "right to disconnect" policy before I can answer this. The arrangement does not matter if the culture is always-on.',
      'Remote with strong async norms — no reply expected after 6 PM, no weekend messages, real PTO. That would restore my enthusiasm for remote work.',
    ],
  },
  q10: {
    total: 50,
    answers: [
      '2020-03-30','2020-05-26','2020-06-07','2020-06-18','2020-07-11',
      '2020-08-05','2020-08-26','2020-08-30','2020-10-20','2020-10-25',
      '2021-06-09','2021-06-23','2021-10-12','2021-10-23','2021-10-31',
      '2021-11-07','2021-11-26','2022-01-08','2022-03-15','2022-07-03',
      '2022-07-27','2022-08-19','2022-10-13','2022-11-12','2023-03-26',
      '2023-07-15','2023-11-07','2023-12-04','2024-02-22','2024-03-21',
      '2024-05-11','2024-05-28','2024-10-18','2024-12-23','2024-12-28',
      '2025-01-29','2025-02-26','2025-04-14','2025-04-15','2025-05-05',
      '2025-08-17','2025-09-11','2025-10-01','2025-10-21','2025-11-09',
      '2025-11-12','2025-11-20','2025-11-29','2026-01-05','2026-01-13',
    ],
  },
}

const AI_SUMMARY =
  'Across 50 respondents, overall remote work satisfaction averaged 6.7 out of 10 — ' +
  'moderate but not thriving — while 60% have 3 or more years of remote experience, ' +
  'indicating a mature distributed workforce. Meeting and communication overhead ' +
  'is the dominant productivity blocker (cited in ~28% of open-text responses), ' +
  'followed by boundary-setting difficulties and home distractions. A concerning ' +
  '40% of respondents work 9 or more hours daily, pointing to an always-on culture ' +
  'and burnout risk, particularly among senior employees. Manager effectiveness ' +
  'averages 3.5 out of 5 — room for improvement, especially for newer remote ' +
  'workers who scored it significantly lower. On future preferences, the strongest ' +
  'signals are toward fully remote (34%) and async-first hybrid (28%) arrangements, ' +
  'with only a small minority preferring a primarily in-office setup.'

const TYPE_LABELS = {
  text: 'Short Answer', paragraph: 'Paragraph', mcq: 'Multiple Choice',
  checkbox: 'Checkboxes', dropdown: 'Dropdown', true_false: 'True / False',
  rating: 'Rating', date: 'Date',
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function HardcodedAISampleResults() {
  const nav = useNavigate()
  const color = FORM.theme_color

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/')}>
          ← Dashboard
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15, marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {FORM.title}
        </span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <span className="badge badge-blue" style={{ fontSize: 12, padding: '5px 12px' }}>
            Sample / Hardcoded
          </span>
        </div>
      </nav>

      <div className="resp-body">

        {/* ── Stats row ── */}
        <div className="stats-row mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          {[
            { icon: '📥', label: 'Total Responses', value: 50,            bg: '#eef2ff' },
            { icon: '❓', label: 'Questions',        value: 10,            bg: '#f0fdf4' },
            { icon: '✅', label: 'Status',            value: 'Active',     bg: '#f0fdf4', vc: '#16a34a', vs: 16 },
            { icon: '🤖', label: 'AI Analysis',       value: 'Ready',      bg: '#fff7ed', vc: '#ea580c', vs: 16 },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: s.vs || 24, color: s.vc || 'var(--text)' }}>
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI Summary ── */}
        <div className="ai-card">
          <div className="ai-badge">🤖 AI Summary</div>
          <div className="ai-text">{AI_SUMMARY}</div>
        </div>

        {/* ── Per-question results ── */}
        {FORM.questions.map((q, i) => {
          const s = STATS[q.id]
          return (
            <div className="q-result-card" key={q.id}>
              <div className="qr-header">
                <div className="qr-header-left">
                  <div className="qr-num">Question {i + 1}</div>
                  <div className="qr-q">{q.question}</div>
                </div>
                <div className="qr-meta">
                  <span className="badge badge-purple">{TYPE_LABELS[q.type] || q.type}</span>
                  <span className="badge badge-green">{s.total} responses</span>
                </div>
              </div>
              <QuestionResult q={q} s={s} color={color} />
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ── Renderers ───────────────────────────────────────────────────────── */

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
        {s.answers.map((a, i) => (
          <span key={i} className="date-chip">📅 {a}</span>
        ))}
      </div>
    )
  }
  // text / paragraph
  return (
    <div className="text-resps">
      {s.answers.map((a, i) => (
        <div key={i} className="text-resp">{a}</div>
      ))}
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
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Inter', size: 12 }, color: '#64748b' },
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { family: 'Inter', size: 12 }, color: '#64748b' },
              grid: { color: '#f1f5f9' },
            },
          },
        }}
      />
    </div>
  )
}

function RatingResult({ s }) {
  const avg   = s.average
  const scale = s.scale || 5
  const dist  = s.distribution || {}
  // build ordered keys from 1..scale
  const keys  = Array.from({ length: scale }, (_, i) => i + 1).reverse() // high→low
  const max   = Math.max(...Object.values(dist), 1)

  return (
    <div className="rating-display">
      {/* Average */}
      <div>
        <div className="rating-avg">{avg}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontWeight: 600 }}>
          out of {scale}
        </div>
        {scale === 5 && (
          <div className="rating-stars-row">
            {[1,2,3,4,5].map(n => (
              <span key={n} className={`rating-star ${n <= Math.round(avg) ? 'on' : 'off'}`}>★</span>
            ))}
          </div>
        )}
        <div className="rating-count">{s.total} ratings</div>
      </div>

      {/* Distribution bars */}
      <div className="rating-dist">
        {keys.map(n => {
          const cnt = dist[n] || 0
          const pct = Math.round((cnt / max) * 100)
          return (
            <div key={n} className="dist-row">
              <div className="dist-lbl">{n}{scale === 5 ? '★' : ''}</div>
              <div className="dist-bar-bg">
                <div className="dist-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="dist-cnt">{cnt}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

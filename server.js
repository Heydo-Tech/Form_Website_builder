const express = require('express')
const cors    = require('cors')
const morgan  = require('morgan')
const path    = require('path')

const formsRouter     = require('./routes/forms')
const responsesRouter = require('./routes/responses')

const app  = express()
const PORT = process.env.PORT || 5001

/* ── Middleware ──────────────────────────────────────────────────── */
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))          // request logging: GET /api/forms 200 4ms

/* ── API Routes ──────────────────────────────────────────────────── */
app.use('/api/forms',                   formsRouter)
app.use('/api/forms/:id/responses',     responsesRouter)

/* ── Health check ────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime().toFixed(1) + 's',
    node:      process.version,
  })
})

/* ── Serve React build (production) ──────────────────────────────── */
const DIST = path.join(__dirname, 'frontend/dist')
app.use(express.static(DIST))
app.get('*', (req, res) => {
  const index = path.join(DIST, 'index.html')
  const fs    = require('fs')
  if (fs.existsSync(index)) {
    res.sendFile(index)
  } else {
    res.status(200).json({
      message: 'FormCraft API is running.',
      hint:    'cd frontend && npm install && npm run dev  (for React dev server on :3000)',
      api:     'http://localhost:5000/api',
    })
  }
})

/* ── Global error handler ────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[Error]', err.message)
  res.status(500).json({ error: 'Internal server error', details: err.message })
})

/* ── Start ───────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗')
  console.log(`║  🚀  FormCraft API  →  http://localhost:${PORT}  ║`)
  console.log('╚════════════════════════════════════════╝')
  console.log('\n  API Endpoints:')
  console.log(`  GET    /api/health`)
  console.log(`  GET    /api/forms`)
  console.log(`  POST   /api/forms`)
  console.log(`  GET    /api/forms/:id`)
  console.log(`  PUT    /api/forms/:id`)
  console.log(`  DELETE /api/forms/:id`)
  console.log(`  POST   /api/forms/:id/duplicate`)
  console.log(`  PATCH  /api/forms/:id/toggle`)
  console.log(`  POST   /api/forms/:id/responses`)
  console.log(`  GET    /api/forms/:id/responses`)
  console.log(`  DELETE /api/forms/:id/responses`)
  console.log(`  DELETE /api/forms/:id/responses/:rid`)
  console.log(`  GET    /api/forms/:id/responses/summary`)
  console.log(`  GET    /api/forms/:id/responses/export`)
  console.log('\n  React dev → cd frontend && npm run dev\n')
})

// ============================================================
//  ██████╗ ██╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗
//  ██╔══██╗██║╚══███╔╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
//  ██████╔╝██║  ███╔╝ ██║     ██║   ██║██████╔╝█████╗
//  ██╔══██╗██║ ███╔╝  ██║     ██║   ██║██╔══██╗██╔══╝
//  ██████╔╝██║███████╗╚██████╗╚██████╔╝██║  ██║███████╗
//  ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
//
//  BizCore API v1.0
//  Powering businesses. Everywhere. 🌍
//
//  Origin  : Siak, Riau, Indonesia 🇮🇩
//  Started : Late night shift at Indah Kiat, 2025
//  Mission : 150 million businesses worldwide
// ============================================================

require('dotenv').config()

const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')

const v1Routes              = require('./routes/v1')
const { apiLimiter }        = require('./middleware/rateLimit')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app  = express()
const PORT = process.env.PORT || 3000

// ── Security ─────────────────────────────────────────────────
app.use(helmet())
app.set('trust proxy', 1)

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

// ── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// ── Body Parser ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Rate Limiting ────────────────────────────────────────────
app.use('/api/', apiLimiter)

// ── Root ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success:  true,
    name:     'BizCore API',
    version:  'v1.0.0',
    tagline:  'Powering businesses. Everywhere. 🌍',
    origin:   'Siak, Riau, Indonesia 🇮🇩',
    docs:     `${req.protocol}://${req.get('host')}/api/v1`,
    status:   'operational',
    timestamp: new Date().toISOString(),
  })
})

app.get('/health', (req, res) => {
  res.json({
    success:   true,
    status:    'healthy',
    uptime:    `${Math.floor(process.uptime())}s`,
    memory:    `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    timestamp: new Date().toISOString(),
  })
})

// ── API Routes ───────────────────────────────────────────────
app.use('/api/v1', v1Routes)

// ── 404 & Error Handler ──────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║           🚀 BizCore API v1.0                ║
║     Powering businesses. Everywhere. 🌍      ║
╠══════════════════════════════════════════════╣
║  Port    : ${PORT}                               ║
║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(34)}║
║  Origin  : Siak, Riau, Indonesia 🇮🇩          ║
║  Mission : 150M businesses worldwide 🌍      ║
╚══════════════════════════════════════════════╝

  Endpoints:
  → POST   /api/v1/auth/register
  → POST   /api/v1/auth/login
  → POST   /api/v1/auth/refresh
  → GET    /api/v1/auth/me
  → GET    /api/v1/products
  → POST   /api/v1/products
  → GET    /api/v1/transactions
  → POST   /api/v1/transactions
  → GET    /api/v1/reports/summary
  → GET    /api/v1/reports/daily
  → GET    /api/v1/reports/top-products
  → GET    /api/v1/debts
  → POST   /api/v1/debts
  → PATCH  /api/v1/debts/:id/pay
  → GET    /api/v1/branches
  → GET    /api/v1/categories
  → GET    /api/v1/team
  `)
})

module.exports = app

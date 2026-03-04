const rateLimit = require('express-rate-limit')

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (req, res) => res.status(429).json({ success: false, message }),
  })

// General API — 100 req/menit
const apiLimiter = createLimiter(60 * 1000, 100, 'Terlalu banyak request. Coba lagi dalam 1 menit.')

// Auth — 10 req/15 menit (anti brute force)
const authLimiter = createLimiter(15 * 60 * 1000, 10, 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.')

// Heavy endpoints — 30 req/menit
const heavyLimiter = createLimiter(60 * 1000, 30, 'Terlalu banyak request. Coba lagi dalam 1 menit.')

module.exports = { apiLimiter, authLimiter, heavyLimiter }

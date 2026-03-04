const { error } = require('../utils/response')

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message)

  if (err.name === 'ValidationError') return error(res, err.message, 422)
  if (err.code === 'PGRST116')        return error(res, 'Data tidak ditemukan', 404)
  if (err.code === '23505')           return error(res, 'Data sudah ada (duplikat)', 409)
  if (err.code === '23503')           return error(res, 'Referensi data tidak valid', 400)

  return error(res, process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, 500)
}

const notFound = (req, res) => {
  return error(res, `Route ${req.method} ${req.originalUrl} tidak ditemukan`, 404)
}

module.exports = { errorHandler, notFound }

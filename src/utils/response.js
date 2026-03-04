// ── Standardized API Response ────────────────────────────────

const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = { success: true, message }
  if (meta)           response.meta = meta
  if (data !== null)  response.data = data
  return res.status(statusCode).json(response)
}

const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const response = { success: false, message }
  if (errors) response.errors = errors
  return res.status(statusCode).json(response)
}

const paginate = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    meta: {
      total,
      page:        Number(page),
      limit:       Number(limit),
      total_pages: Math.ceil(total / limit),
      has_next:    page * limit < total,
      has_prev:    page > 1,
    },
    data,
  })
}

module.exports = { success, error, paginate }

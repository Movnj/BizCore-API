const Joi = require('joi')
const { error } = require('../utils/response')

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error: validationError } = schema.validate(req[property], { abortEarly: false, stripUnknown: true })
  if (!validationError) return next()

  const errors = validationError.details.map(d => ({
    field:   d.path.join('.'),
    message: d.message.replace(/['"]/g, ''),
  }))

  return error(res, 'Validasi gagal', 422, errors)
}

// ── Schemas ──────────────────────────────────────────────────

const schemas = {
  // Auth
  register: Joi.object({
    fullName: Joi.string().min(2).max(100).required().messages({ 'any.required': 'Nama lengkap wajib diisi' }),
    email:    Joi.string().email().required().messages({ 'any.required': 'Email wajib diisi' }),
    password: Joi.string().min(6).required().messages({ 'any.required': 'Password wajib diisi', 'string.min': 'Password minimal 6 karakter' }),
  }),

  login: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Products
  createProduct: Joi.object({
    name:        Joi.string().min(1).max(200).required(),
    sku:         Joi.string().max(50).optional().allow(''),
    category_id: Joi.string().uuid().optional().allow(null),
    buy_price:   Joi.number().min(0).optional().default(0),
    sell_price:  Joi.number().min(0).required(),
    stock:       Joi.number().integer().min(0).optional().default(0),
    min_stock:   Joi.number().integer().min(0).optional().default(5),
    unit:        Joi.string().max(20).optional().default('pcs'),
    description: Joi.string().max(500).optional().allow(''),
    branch_id:   Joi.string().uuid().required(),
  }),

  updateProduct: Joi.object({
    name:        Joi.string().min(1).max(200).optional(),
    sku:         Joi.string().max(50).optional().allow(''),
    category_id: Joi.string().uuid().optional().allow(null),
    buy_price:   Joi.number().min(0).optional(),
    sell_price:  Joi.number().min(0).optional(),
    stock:       Joi.number().integer().min(0).optional(),
    min_stock:   Joi.number().integer().min(0).optional(),
    unit:        Joi.string().max(20).optional(),
    description: Joi.string().max(500).optional().allow(''),
    is_active:   Joi.boolean().optional(),
  }),

  // Transactions
  createTransaction: Joi.object({
    branch_id:      Joi.string().uuid().required(),
    items:          Joi.array().items(Joi.object({
      product_id:  Joi.string().uuid().required(),
      name:        Joi.string().required(),
      qty:         Joi.number().integer().min(1).required(),
      sell_price:  Joi.number().min(0).required(),
      buy_price:   Joi.number().min(0).optional().default(0),
    })).min(1).required(),
    payment_method: Joi.string().valid('cash', 'transfer', 'qris', 'debit', 'credit').optional().default('cash'),
    discount:       Joi.number().min(0).optional().default(0),
    note:           Joi.string().max(500).optional().allow(''),
  }),

  // Debts
  createDebt: Joi.object({
    branch_id:  Joi.string().uuid().required(),
    type:       Joi.string().valid('hutang', 'piutang').required(),
    name:       Joi.string().min(1).max(100).required(),
    amount:     Joi.number().min(1).required(),
    phone:      Joi.string().max(20).optional().allow(''),
    due_date:   Joi.string().isoDate().optional().allow(null),
    notes:      Joi.string().max(500).optional().allow(''),
  }),
}

module.exports = { validate, schemas }

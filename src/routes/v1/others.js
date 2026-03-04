const router = require('express').Router()
const { supabaseAdmin }                  = require('../../config/supabase')
const { authenticate, requireAdmin, requireOwner } = require('../../middleware/auth')
const { validate, schemas }              = require('../../middleware/validate')
const { success, error, paginate }       = require('../../utils/response')

// ── DEBTS ────────────────────────────────────────────────────
const debtRouter = require('express').Router()
debtRouter.use(authenticate)

debtRouter.get('/', async (req, res, next) => {
  try {
    const { type, status, branch_id, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('debts')
      .select('*', { count: 'exact' })
      .eq('tenant_id', req.profile.tenant_id)
      .order('created_at', { ascending: false })

    if (type)      query = query.eq('type', type)
    if (status)    query = query.eq('status', status)
    if (branch_id) query = query.eq('branch_id', branch_id)

    const { data, count, error: dbError } = await query.range(offset, offset + Number(limit) - 1)
    if (dbError) throw dbError

    return paginate(res, data, count, page, limit, 'Data hutang/piutang berhasil diambil')
  } catch (err) {
    next(err)
  }
})

debtRouter.post('/', requireAdmin, validate(schemas.createDebt), async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('debts')
      .insert({ ...req.body, tenant_id: req.profile.tenant_id, paid_amount: 0, status: 'unpaid', created_by: req.user.id })
      .select()
      .single()

    if (dbError) throw dbError
    return success(res, data, 'Hutang/piutang berhasil ditambahkan', 201)
  } catch (err) {
    next(err)
  }
})

debtRouter.patch('/:id/pay', requireAdmin, async (req, res, next) => {
  try {
    const { amount } = req.body
    if (!amount) return error(res, 'Jumlah pembayaran wajib diisi', 400)

    const { data: debt } = await supabaseAdmin.from('debts').select('*').eq('id', req.params.id).single()
    if (!debt) return error(res, 'Data tidak ditemukan', 404)

    const newPaid  = Number(debt.paid_amount) + Number(amount)
    const newStatus = newPaid >= Number(debt.amount) ? 'paid' : 'partial'

    const { data, error: dbError } = await supabaseAdmin
      .from('debts')
      .update({ paid_amount: newPaid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('tenant_id', req.profile.tenant_id)
      .select()
      .single()

    if (dbError) throw dbError
    return success(res, data, `Pembayaran berhasil. Status: ${newStatus}`)
  } catch (err) {
    next(err)
  }
})

// ── BRANCHES ─────────────────────────────────────────────────
const branchRouter = require('express').Router()
branchRouter.use(authenticate)

branchRouter.get('/', async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('tenant_id', req.profile.tenant_id)
      .order('created_at')

    if (dbError) throw dbError
    return success(res, data, 'Cabang berhasil diambil')
  } catch (err) {
    next(err)
  }
})

branchRouter.post('/', requireOwner, async (req, res, next) => {
  try {
    const { name, address, phone } = req.body
    if (!name) return error(res, 'Nama cabang wajib diisi', 400)

    const { data, error: dbError } = await supabaseAdmin
      .from('branches')
      .insert({ name, address, phone, tenant_id: req.profile.tenant_id, owner: req.profile.full_name })
      .select()
      .single()

    if (dbError) throw dbError
    return success(res, data, 'Cabang berhasil ditambahkan', 201)
  } catch (err) {
    next(err)
  }
})

// ── CATEGORIES ───────────────────────────────────────────────
const categoryRouter = require('express').Router()
categoryRouter.use(authenticate)

categoryRouter.get('/', async (req, res, next) => {
  try {
    const { type } = req.query
    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .eq('tenant_id', req.profile.tenant_id)
      .order('name')

    if (type) query = query.eq('type', type)

    const { data, error: dbError } = await query
    if (dbError) throw dbError
    return success(res, data, 'Kategori berhasil diambil')
  } catch (err) {
    next(err)
  }
})

categoryRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, icon, type, color } = req.body
    if (!name || !type) return error(res, 'Nama dan tipe kategori wajib diisi', 400)

    const { data, error: dbError } = await supabaseAdmin
      .from('categories')
      .insert({ name, icon, type, color, tenant_id: req.profile.tenant_id })
      .select()
      .single()

    if (dbError) throw dbError
    return success(res, data, 'Kategori berhasil ditambahkan', 201)
  } catch (err) {
    next(err)
  }
})

// ── TEAM ─────────────────────────────────────────────────────
const teamRouter = require('express').Router()
teamRouter.use(authenticate)

teamRouter.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, is_active, created_at')
      .eq('tenant_id', req.profile.tenant_id)
      .order('created_at')

    if (dbError) throw dbError
    return success(res, data, 'Tim berhasil diambil')
  } catch (err) {
    next(err)
  }
})

teamRouter.get('/invites', requireOwner, async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('tenant_id', req.profile.tenant_id)
      .order('created_at', { ascending: false })

    if (dbError) throw dbError
    return success(res, data, 'Invite berhasil diambil')
  } catch (err) {
    next(err)
  }
})

module.exports = { debtRouter, branchRouter, categoryRouter, teamRouter }

const router  = require('express').Router()
const { supabaseAdmin }           = require('../../config/supabase')
const { authenticate, requireAdmin } = require('../../middleware/auth')
const { validate, schemas }       = require('../../middleware/validate')
const { heavyLimiter }            = require('../../middleware/rateLimit')
const { success, error, paginate } = require('../../utils/response')

router.use(authenticate)

// GET /api/v1/products
router.get('/', async (req, res, next) => {
  try {
    const { branch_id, category_id, search, low_stock, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('products')
      .select('*, categories(id, name, icon, color)', { count: 'exact' })
      .eq('tenant_id', req.profile.tenant_id)
      .eq('is_active', true)

    if (branch_id)   query = query.eq('branch_id', branch_id)
    if (category_id) query = query.eq('category_id', category_id)
    if (search)      query = query.ilike('name', `%${search}%`)
    if (low_stock === 'true') query = query.lt('stock', supabaseAdmin.raw('min_stock'))

    const { data, count, error: dbError } = await query
      .order('name')
      .range(offset, offset + Number(limit) - 1)

    if (dbError) throw dbError
    return paginate(res, data, count, page, limit, 'Produk berhasil diambil')
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, icon, color)')
      .eq('id', req.params.id)
      .eq('tenant_id', req.profile.tenant_id)
      .single()

    if (dbError) return error(res, 'Produk tidak ditemukan', 404)
    return success(res, data, 'Produk berhasil diambil')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/products
router.post('/', requireAdmin, validate(schemas.createProduct), async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .insert({ ...req.body, tenant_id: req.profile.tenant_id, is_active: true })
      .select('*, categories(id, name, icon)')
      .single()

    if (dbError) throw dbError
    return success(res, data, 'Produk berhasil ditambahkan', 201)
  } catch (err) {
    next(err)
  }
})

// PUT /api/v1/products/:id
router.put('/:id', requireAdmin, validate(schemas.updateProduct), async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('tenant_id', req.profile.tenant_id)
      .select()
      .single()

    if (dbError) throw dbError
    return success(res, data, 'Produk berhasil diupdate')
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/products/:id (soft delete)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { error: dbError } = await supabaseAdmin
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('tenant_id', req.profile.tenant_id)

    if (dbError) throw dbError
    return success(res, null, 'Produk berhasil dihapus')
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/products/:id/stock — update stok manual
router.patch('/:id/stock', requireAdmin, async (req, res, next) => {
  try {
    const { stock, note } = req.body
    if (stock === undefined) return error(res, 'Stok wajib diisi', 400)

    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .update({ stock, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('tenant_id', req.profile.tenant_id)
      .select()
      .single()

    if (dbError) throw dbError

    // Log stok
    await supabaseAdmin.from('stock_logs').insert({
      product_id: req.params.id,
      tenant_id:  req.profile.tenant_id,
      change:     stock,
      note:       note || 'Update stok manual',
      created_by: req.user.id,
    }).catch(() => {})

    return success(res, data, 'Stok berhasil diupdate')
  } catch (err) {
    next(err)
  }
})

module.exports = router

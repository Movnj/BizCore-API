const router = require('express').Router()
const { supabaseAdmin }              = require('../../config/supabase')
const { authenticate }               = require('../../middleware/auth')
const { validate, schemas }          = require('../../middleware/validate')
const { success, error, paginate }   = require('../../utils/response')

router.use(authenticate)

// GET /api/v1/transactions
router.get('/', async (req, res, next) => {
  try {
    const { branch_id, from, to, type, payment_method, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('transactions')
      .select('*, transaction_items(*), profiles(full_name)', { count: 'exact' })
      .eq('tenant_id', req.profile.tenant_id)
      .order('date', { ascending: false })

    if (branch_id)      query = query.eq('branch_id', branch_id)
    if (type)           query = query.eq('type', type)
    if (payment_method) query = query.eq('payment_method', payment_method)
    if (from)           query = query.gte('date', from)
    if (to)             query = query.lte('date', to)

    const { data, count, error: dbError } = await query.range(offset, offset + Number(limit) - 1)
    if (dbError) throw dbError

    return paginate(res, data, count, page, limit, 'Transaksi berhasil diambil')
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/transactions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabaseAdmin
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('id', req.params.id)
      .eq('tenant_id', req.profile.tenant_id)
      .single()

    if (dbError) return error(res, 'Transaksi tidak ditemukan', 404)
    return success(res, data, 'Transaksi berhasil diambil')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/transactions
router.post('/', validate(schemas.createTransaction), async (req, res, next) => {
  try {
    const { branch_id, items, payment_method, discount = 0, note } = req.body

    const subtotal = items.reduce((s, i) => s + (i.sell_price * i.qty), 0)
    const amount   = subtotal - discount
    const profit   = items.reduce((s, i) => s + ((i.sell_price - (i.buy_price || 0)) * i.qty), 0) - discount

    // Create transaction
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        branch_id,
        tenant_id:      req.profile.tenant_id,
        type:           'sale',
        is_income:      true,
        amount,
        discount,
        profit,
        payment_method: payment_method || 'cash',
        note,
        date:           new Date().toISOString(),
        created_by:     req.user.id,
      })
      .select()
      .single()

    if (txError) throw txError

    // Insert items
    const { error: itemsError } = await supabaseAdmin
      .from('transaction_items')
      .insert(items.map(i => ({
        transaction_id: tx.id,
        product_id:     i.product_id,
        product_name:   i.name,
        qty:            i.qty,
        sell_price:     i.sell_price,
        buy_price:      i.buy_price || 0,
        subtotal:       i.sell_price * i.qty,
        tenant_id:      req.profile.tenant_id,
      })))

    if (itemsError) throw itemsError

    // Update stock
    for (const item of items) {
      await supabaseAdmin
        .from('products')
        .update({ stock: supabaseAdmin.raw(`stock - ${item.qty}`) })
        .eq('id', item.product_id)
        .eq('tenant_id', req.profile.tenant_id)
        .catch(() => {})
    }

    return success(res, { ...tx, items }, 'Transaksi berhasil dibuat', 201)
  } catch (err) {
    next(err)
  }
})

module.exports = router

const router = require('express').Router()
const { supabaseAdmin }  = require('../../config/supabase')
const { authenticate }   = require('../../middleware/auth')
const { success }        = require('../../utils/response')

router.use(authenticate)

// GET /api/v1/reports/summary
router.get('/summary', async (req, res, next) => {
  try {
    const { branch_id, from, to } = req.query
    const fromDate = from || new Date(new Date().setDate(1)).toISOString()
    const toDate   = to   || new Date().toISOString()

    let query = supabaseAdmin
      .from('transactions')
      .select('amount, is_income, profit, type, payment_method')
      .eq('tenant_id', req.profile.tenant_id)
      .gte('date', fromDate)
      .lte('date', toDate)

    if (branch_id) query = query.eq('branch_id', branch_id)

    const { data, error } = await query
    if (error) throw error

    const income  = data.filter(t => t.is_income).reduce((s, t)  => s + Number(t.amount), 0)
    const expense = data.filter(t => !t.is_income).reduce((s, t) => s + Number(t.amount), 0)
    const profit  = data.reduce((s, t) => s + Number(t.profit || 0), 0)
    const sales   = data.filter(t => t.type === 'sale')

    // Payment method breakdown
    const paymentBreakdown = data.reduce((acc, t) => {
      if (!t.is_income) return acc
      acc[t.payment_method] = (acc[t.payment_method] || 0) + Number(t.amount)
      return acc
    }, {})

    return success(res, {
      period: { from: fromDate, to: toDate },
      summary: {
        income,
        expense,
        profit,
        net: income - expense,
      },
      transactions: {
        total:   data.length,
        sales:   sales.length,
        average: sales.length > 0 ? income / sales.length : 0,
      },
      payment_breakdown: paymentBreakdown,
    }, 'Laporan berhasil diambil')
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/reports/top-products
router.get('/top-products', async (req, res, next) => {
  try {
    const { branch_id, from, to, limit = 10 } = req.query

    const { data, error } = await supabaseAdmin
      .from('transaction_items')
      .select('product_id, product_name, qty, sell_price, subtotal')
      .eq('tenant_id', req.profile.tenant_id)

    if (error) throw error

    const grouped = {}
    data.forEach(item => {
      const key = item.product_id
      if (!grouped[key]) grouped[key] = { product_id: key, name: item.product_name, total_qty: 0, total_revenue: 0, total_orders: 0 }
      grouped[key].total_qty     += Number(item.qty)
      grouped[key].total_revenue += Number(item.subtotal || item.sell_price * item.qty)
      grouped[key].total_orders  += 1
    })

    const sorted = Object.values(grouped)
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, Number(limit))

    return success(res, sorted, 'Top produk berhasil diambil')
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/reports/daily
router.get('/daily', async (req, res, next) => {
  try {
    const { branch_id, month, year } = req.query
    const now  = new Date()
    const y    = year  || now.getFullYear()
    const m    = month || now.getMonth() + 1
    const from = `${y}-${String(m).padStart(2, '0')}-01`
    const to   = `${y}-${String(m).padStart(2, '0')}-31`

    let query = supabaseAdmin
      .from('transactions')
      .select('date, amount, is_income, profit')
      .eq('tenant_id', req.profile.tenant_id)
      .gte('date', from)
      .lte('date', to)
      .order('date')

    if (branch_id) query = query.eq('branch_id', branch_id)

    const { data, error } = await query
    if (error) throw error

    // Group by day
    const daily = {}
    data.forEach(t => {
      const day = t.date.substring(0, 10)
      if (!daily[day]) daily[day] = { date: day, income: 0, expense: 0, profit: 0, transactions: 0 }
      if (t.is_income)  daily[day].income  += Number(t.amount)
      else              daily[day].expense += Number(t.amount)
      daily[day].profit       += Number(t.profit || 0)
      daily[day].transactions += 1
    })

    return success(res, Object.values(daily), 'Laporan harian berhasil diambil')
  } catch (err) {
    next(err)
  }
})

module.exports = router

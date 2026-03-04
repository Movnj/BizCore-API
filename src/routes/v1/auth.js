const router = require('express').Router()
const { supabase, supabaseAdmin } = require('../../config/supabase')
const { authenticate }            = require('../../middleware/auth')
const { authLimiter }             = require('../../middleware/rateLimit')
const { validate, schemas }       = require('../../middleware/validate')
const { success, error }          = require('../../utils/response')

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate(schemas.register), async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body

    const { data, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (authError) throw authError

    const { error: rpcError } = await supabaseAdmin.rpc('create_tenant_only', {
      p_user_id:   data.user.id,
      p_full_name: fullName,
      p_email:     email,
    })
    if (rpcError) throw rpcError

    return success(res, {
      user: { id: data.user.id, email: data.user.email },
    }, 'Akun berhasil dibuat. Silakan setup toko kamu.', 201)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) return error(res, 'Email atau password salah', 401)

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*, tenants(id, name, sector)')
      .eq('id', data.user.id)
      .single()

    return success(res, {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
      user:          { id: data.user.id, email: data.user.email },
      profile,
    }, 'Login berhasil')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body
    if (!refresh_token) return error(res, 'Refresh token wajib diisi', 400)

    const { data, error: refreshError } = await supabase.auth.refreshSession({ refresh_token })
    if (refreshError) return error(res, 'Refresh token tidak valid', 401)

    return success(res, {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
    }, 'Token berhasil diperbarui')
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res) => {
  return success(res, {
    user:    { id: req.user.id, email: req.user.email },
    profile: req.profile,
  }, 'Data user berhasil diambil')
})

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await supabase.auth.signOut()
    return success(res, null, 'Logout berhasil')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return error(res, 'Email wajib diisi', 400)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.ALLOWED_ORIGINS?.split(',')[0]}/reset`,
    })

    return success(res, null, 'Email reset password telah dikirim')
  } catch (err) {
    next(err)
  }
})

module.exports = router

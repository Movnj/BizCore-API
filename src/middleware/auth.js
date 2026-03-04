const { supabase, supabaseAdmin } = require('../config/supabase')
const { error } = require('../utils/response')

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return error(res, 'Token tidak ditemukan', 401)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return error(res, 'Token tidak valid atau sudah expired', 401)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, tenants(id, name, sector)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) return error(res, 'Profil tidak ditemukan', 401)
    if (!profile.is_active)       return error(res, 'Akun tidak aktif', 403)

    req.user    = user
    req.profile = profile
    req.token   = token
    next()
  } catch (err) {
    return error(res, 'Authentication gagal', 401)
  }
}

// Role guard — hanya owner & admin
const requireAdmin = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.profile?.role)) {
    return error(res, 'Akses ditolak. Hanya Owner/Admin yang diizinkan.', 403)
  }
  next()
}

// Role guard — hanya owner
const requireOwner = (req, res, next) => {
  if (req.profile?.role !== 'owner') {
    return error(res, 'Akses ditolak. Hanya Owner yang diizinkan.', 403)
  }
  next()
}

module.exports = { authenticate, requireAdmin, requireOwner }

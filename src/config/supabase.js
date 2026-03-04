const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Public client — respects RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Admin client — bypasses RLS (only for server-side operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

module.exports = { supabase, supabaseAdmin }

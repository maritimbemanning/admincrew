import { createClient } from '@supabase/supabase-js'

// Service role client for admin operations
// WARNING: Only use on server-side, never expose to client
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // During build time, return a dummy client
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

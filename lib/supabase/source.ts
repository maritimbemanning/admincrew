/**
 * Source Supabase Client for bluecrew.no
 *
 * This client is used ONLY for reading data from the bluecrew.no database
 * for migration purposes. It should NEVER be used for writes.
 *
 * Source project: bluecrew-v3 (uqwfesvsfiqjcpzwetkz)
 * Target project: admincrew v2 (zhqocakrwcqwxubbondi)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Validate environment variables
const sourceUrl = process.env.SOURCE_SUPABASE_URL
const sourceKey = process.env.SOURCE_SUPABASE_KEY

if (!sourceUrl || !sourceKey) {
  console.warn(
    'Source Supabase credentials not found. Migration features will be disabled. ' +
    'Set SOURCE_SUPABASE_URL and SOURCE_SUPABASE_KEY in .env.local'
  )
}

/**
 * Create a Supabase client for the source (bluecrew.no) database.
 * This client uses service role key for read access to all tables.
 */
export function createSourceClient() {
  if (!sourceUrl || !sourceKey) {
    throw new Error(
      'Source Supabase credentials not configured. ' +
      'Please set SOURCE_SUPABASE_URL and SOURCE_SUPABASE_KEY in .env.local'
    )
  }

  return createSupabaseClient(sourceUrl, sourceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Check if source database is configured
 */
export function isSourceConfigured(): boolean {
  return Boolean(sourceUrl && sourceKey)
}

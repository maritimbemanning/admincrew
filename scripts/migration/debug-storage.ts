/**
 * Debug storage access
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!

console.log('SOURCE_URL:', SOURCE_URL)
console.log('SOURCE_KEY length:', SOURCE_KEY ? SOURCE_KEY.length : 0)
console.log('Key prefix:', SOURCE_KEY ? SOURCE_KEY.substring(0, 20) + '...' : 'none')

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function debug() {
  console.log('\n--- Testing bucket listing ---')

  // List buckets
  const { data: buckets, error: bucketsError } = await sourceClient.storage.listBuckets()
  console.log('\nBuckets:', buckets)
  console.log('Buckets error:', bucketsError)

  // Try listing with empty path
  console.log('\n--- Testing candidate-cvs bucket ---')
  const { data: root, error: rootError } = await sourceClient.storage
    .from('candidate-cvs')
    .list('', { limit: 10 })
  console.log('Root list:', root)
  console.log('Root error:', rootError)

  // Try different path formats
  console.log('\n--- Testing uploads/ path ---')
  const { data: uploads, error: uploadsError } = await sourceClient.storage
    .from('candidate-cvs')
    .list('uploads', { limit: 10 })
  console.log('Uploads list:', uploads)
  console.log('Uploads error:', uploadsError)

  // Try direct file download to check access
  console.log('\n--- Testing direct file download ---')
  const { data: fileData, error: fileError } = await sourceClient.storage
    .from('candidate-cvs')
    .download('uploads/1765399058512-yu6r4z9-CV_H_vard_Soltvedt_.pdf')
  console.log('File download result:', fileData ? 'Got blob of size ' + fileData.size : 'No data')
  console.log('File error:', fileError)

  // Check if it's using anon key vs service role
  console.log('\n--- Checking key type ---')
  if (SOURCE_KEY.startsWith('eyJ')) {
    // It's a JWT
    try {
      const payload = JSON.parse(Buffer.from(SOURCE_KEY.split('.')[1], 'base64').toString())
      console.log('Key role:', payload.role)
    } catch (e) {
      console.log('Could not decode JWT')
    }
  }
}

debug().catch(console.error)

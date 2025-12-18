import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { mapRole } from './role-mapping'

const sourceClient = createClient(process.env.SOURCE_SUPABASE_URL!, process.env.SOURCE_SUPABASE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function check() {
  const { data } = await sourceClient
    .from('candidates')
    .select('name, work_main')
    .not('work_main', 'is', null)
    .limit(10)
  
  console.log('Testing role mapping:\n')
  data?.forEach((c: any) => {
    const roles = c.work_main || []
    const primary = roles.length > 0 ? mapRole(roles[0]) : 'other'
    console.log('Name:', c.name)
    console.log('  work_main[0]:', roles[0])
    console.log('  Mapped to:', primary)
    console.log('')
  })
}

check().catch(console.error)

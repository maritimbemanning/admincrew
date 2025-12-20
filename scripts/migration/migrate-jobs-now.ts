// Quick migration script for job_postings
import { createClient } from '@supabase/supabase-js'

const OLD_URL = 'https://uqwfesvsfiqjcpzwetkz.supabase.co'
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxd2Zlc3ZzZmlxamNwendldGt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYwMjUxNSwiZXhwIjoyMDc2MTc4NTE1fQ.CaEp1O6dDOZgU7SiImVctdSMNhvQsa28NwIcqg-pmGQ'

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const oldClient = createClient(OLD_URL, OLD_KEY)
const newClient = createClient(NEW_URL, NEW_KEY)

async function migrate() {
  console.log('🚀 MIGRERER JOB_POSTINGS')
  console.log('========================\n')

  // 1. Hent fra gammel
  const { data: oldJobs, error: fetchErr } = await oldClient
    .from('job_postings')
    .select('*')
  
  if (fetchErr) {
    console.log('❌ Fetch error:', fetchErr.message)
    return
  }

  console.log(`📊 Fant ${oldJobs?.length || 0} stillinger i gammel DB`)
  
  const activeJobs = oldJobs?.filter((j: any) => j.status === 'active') || []
  console.log(`   - ${activeJobs.length} aktive`)
  
  if (!oldJobs || oldJobs.length === 0) {
    console.log('Ingen stillinger å migrere')
    return
  }

  // 2. List aktive stillinger
  console.log('\n📋 Aktive stillinger:')
  activeJobs.forEach((j: any) => {
    console.log(`   - ${j.title} (${j.slug})`)
  })

  // 3. Insert i ny database
  console.log('\n🔄 Migrerer...')
  let migrated = 0, skipped = 0, errors = 0

  for (const job of oldJobs) {
    // Sjekk om finnes allerede (via slug)
    const { data: existing } = await newClient
      .from('job_postings')
      .select('id')
      .eq('slug', job.slug)
      .single()

    if (existing) {
      console.log(`   ⏭️  ${job.slug} finnes allerede`)
      skipped++
      continue
    }

    // Fjern kolonner som kanskje ikke finnes i ny
    const { 
      customer_id, 
      created_by,
      ...insertData 
    } = job

    const { error: insertErr } = await newClient
      .from('job_postings')
      .insert(insertData)

    if (insertErr) {
      console.log(`   ❌ ${job.slug}: ${insertErr.message}`)
      errors++
    } else {
      console.log(`   ✅ ${job.title}`)
      migrated++
    }
  }

  console.log('\n========================')
  console.log(`📊 RESULTAT:`)
  console.log(`   ✅ Migrert: ${migrated}`)
  console.log(`   ⏭️  Hoppet: ${skipped}`)
  console.log(`   ❌ Feil: ${errors}`)
}

migrate().then(() => process.exit(0)).catch(e => {
  console.error('💥', e)
  process.exit(1)
})

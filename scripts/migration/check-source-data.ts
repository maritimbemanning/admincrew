// Check what data exists in SOURCE database
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const OLD = createClient(process.env.SOURCE_SUPABASE_URL!, process.env.SOURCE_SUPABASE_KEY!)

async function check() {
  console.log('🔍 Sjekker kilde-database...\n')

  // Get a sample of candidates with all columns
  const { data, error } = await OLD
    .from('candidates')
    .select('*')
    .limit(3)

  if (error) {
    console.log('❌ Feil:', error.message)
    return
  }

  console.log('📊 Eksempel-kandidater fra gammel DB:\n')
  
  for (const c of data || []) {
    console.log('='.repeat(50))
    console.log(`Navn: ${c.first_name || c.name || c.navn} ${c.last_name || ''}`)
    console.log(`Email: ${c.email}`)
    console.log('\nAlle felt:')
    for (const [key, value] of Object.entries(c)) {
      if (value !== null && value !== '' && value !== undefined) {
        console.log(`  ${key}: ${JSON.stringify(value)}`)
      }
    }
  }

  // Count non-null values for important fields
  const { data: stats } = await OLD
    .from('candidates')
    .select('fylke, county, municipality, kommune, city, years_of_experience, erfaring')

  let fylkeCount = 0, countyCount = 0, cityCount = 0, expCount = 0

  for (const row of stats || []) {
    if (row.fylke) fylkeCount++
    if (row.county) countyCount++
    if (row.city) cityCount++
    if (row.years_of_experience || row.erfaring) expCount++
  }

  console.log('\n📊 Statistikk:')
  console.log(`  fylke: ${fylkeCount}`)
  console.log(`  county: ${countyCount}`)
  console.log(`  city: ${cityCount}`)
  console.log(`  experience: ${expCount}`)
}

check()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

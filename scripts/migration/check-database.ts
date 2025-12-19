// scripts/migration/check-database.ts
// Sjekker status på begge databaser før migrering

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Last inn .env.local
config({ path: '.env.local' })

// Source (bluecrew.no)
const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!

// Target (admincrew.no)
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkDatabases() {
  console.log('🔍 DATABASE STATUS CHECK')
  console.log('=====================================\n')

  // 1. Sjekk source (bluecrew.no)
  console.log('📦 BLUECREW.NO (SOURCE)')
  console.log('─────────────────────────────────────')
  
  try {
    const sourceClient = createClient(SOURCE_URL, SOURCE_KEY)
    
    // Hent antall kandidater
    const { count: candidateCount, error: candidateError } = await sourceClient
      .from('candidates')
      .select('*', { count: 'exact', head: true })

    if (candidateError) {
      console.log(`  ❌ Kandidater: ${candidateError.message}`)
    } else {
      console.log(`  ✅ Kandidater: ${candidateCount}`)
    }

    // Sjekk felt-strukturen
    const { data: sampleCandidate, error: sampleError } = await sourceClient
      .from('candidates')
      .select('*')
      .limit(1)
      .single()

    if (sampleError) {
      console.log(`  ❌ Kunne ikke hente eksempel: ${sampleError.message}`)
    } else if (sampleCandidate) {
      console.log(`  📋 Felt i candidates-tabellen:`)
      const fields = Object.keys(sampleCandidate)
      fields.slice(0, 15).forEach(field => {
        const value = sampleCandidate[field]
        const type = value === null ? 'null' : typeof value
        console.log(`     - ${field}: ${type}`)
      })
      if (fields.length > 15) {
        console.log(`     ... og ${fields.length - 15} flere felt`)
      }
    }

  } catch (err: any) {
    console.log(`  ❌ FEIL: ${err.message}`)
  }

  console.log('')

  // 2. Sjekk target (admincrew.no)
  console.log('📦 ADMINCREW.NO (TARGET)')
  console.log('─────────────────────────────────────')
  
  try {
    const targetClient = createClient(TARGET_URL, TARGET_KEY)
    
    // Sjekk om candidates-tabellen eksisterer
    const { count: targetCount, error: targetError } = await targetClient
      .from('candidates')
      .select('*', { count: 'exact', head: true })

    if (targetError) {
      if (targetError.message.includes('does not exist')) {
        console.log(`  ⚠️  candidates tabell eksisterer IKKE`)
        console.log(`  → Du må kjøre migrations først!`)
      } else {
        console.log(`  ❌ Kandidater: ${targetError.message}`)
      }
    } else {
      console.log(`  ✅ Kandidater: ${targetCount || 0}`)
    }

    // Sjekk andre tabeller
    const tables = [
      'user_profiles',
      'candidate_certifications', 
      'candidate_documents',
      'candidate_pools',
      'crm_organizations',
      'crm_contacts',
      'customer_requests',
      'assignments',
      'contracts',
      'timesheets'
    ]

    console.log(`  📋 Tabell-status:`)
    for (const table of tables) {
      const { count, error } = await targetClient
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`     ❌ ${table}: MANGLER`)
        } else {
          console.log(`     ⚠️  ${table}: ${error.message}`)
        }
      } else {
        console.log(`     ✅ ${table}: ${count || 0} rader`)
      }
    }

  } catch (err: any) {
    console.log(`  ❌ FEIL: ${err.message}`)
  }

  console.log('\n=====================================')
  console.log('NESTE STEG:')
  console.log('1. Hvis tabeller MANGLER → Kjør migrations')
  console.log('2. Hvis tabeller OK → Kjør test-migration.ts')
  console.log('=====================================\n')
}

// Kjør
checkDatabases()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 FEIL:', err)
    process.exit(1)
  })

// scripts/migration/compare-databases.ts
// Sammenlign tabeller og data i begge Supabase-prosjekter

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const OLD_URL = process.env.SOURCE_SUPABASE_URL!
const OLD_KEY = process.env.SOURCE_SUPABASE_KEY!
const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const oldClient = createClient(OLD_URL, OLD_KEY)
const newClient = createClient(NEW_URL, NEW_KEY)

async function compareDatabases() {
  console.log('🔍 DATABASE COMPARISON')
  console.log('=====================================\n')

  // Liste over tabeller å sjekke
  const tablesToCheck = [
    'candidates',
    'job_postings', 
    'job_applications',
    'contacts',
    'interest_leads',
    'staffing_needs',
    // admincrew-spesifikke
    'user_profiles',
    'candidate_certifications',
    'candidate_documents',
    'candidate_pools',
    'candidate_pool_members',
    'crm_organizations',
    'crm_contacts',
    'crm_deals',
    'crm_activities',
    'crm_tasks',
    'customer_requests',
    'request_shortlists',
    'assignments',
    'release_checklists',
    'contracts',
    'contract_parties',
    'timesheets',
    'invoices',
    'qms_documents',
    'qms_nonconformities',
    'activity_log',
    'portal_contacts'
  ]

  console.log('📦 GAMMEL SUPABASE (bluecrew.no)')
  console.log(`   URL: ${OLD_URL}`)
  console.log('─────────────────────────────────────')
  
  for (const table of tablesToCheck) {
    const { count, error } = await oldClient
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log(`   ❌ ${table}: FINNES IKKE`)
      } else {
        console.log(`   ⚠️  ${table}: ${error.message}`)
      }
    } else {
      console.log(`   ✅ ${table}: ${count} rader`)
    }
  }

  console.log('\n📦 NY SUPABASE (admincrew.no)')
  console.log(`   URL: ${NEW_URL}`)
  console.log('─────────────────────────────────────')
  
  for (const table of tablesToCheck) {
    const { count, error } = await newClient
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log(`   ❌ ${table}: FINNES IKKE`)
      } else {
        console.log(`   ⚠️  ${table}: ${error.message}`)
      }
    } else {
      console.log(`   ✅ ${table}: ${count} rader`)
    }
  }

  // Sjekk kandidat-feltene i begge
  console.log('\n📋 KANDIDAT-FELT SAMMENLIGNING')
  console.log('─────────────────────────────────────')
  
  const { data: oldCandidate } = await oldClient
    .from('candidates')
    .select('*')
    .limit(1)
    .single()

  const { data: newCandidate } = await newClient
    .from('candidates')
    .select('*')
    .limit(1)
    .single()

  if (oldCandidate) {
    const oldFields = Object.keys(oldCandidate).sort()
    console.log(`\n   GAMMEL (${oldFields.length} felt):`)
    console.log(`   ${oldFields.join(', ')}`)
  }

  if (newCandidate) {
    const newFields = Object.keys(newCandidate).sort()
    console.log(`\n   NY (${newFields.length} felt):`)
    console.log(`   ${newFields.join(', ')}`)
  }

  // Finn forskjeller
  if (oldCandidate && newCandidate) {
    const oldFields = new Set(Object.keys(oldCandidate))
    const newFields = new Set(Object.keys(newCandidate))
    
    const onlyInOld = [...oldFields].filter(f => !newFields.has(f))
    const onlyInNew = [...newFields].filter(f => !oldFields.has(f))
    
    if (onlyInOld.length > 0) {
      console.log(`\n   ⚠️  KUN I GAMMEL: ${onlyInOld.join(', ')}`)
    }
    if (onlyInNew.length > 0) {
      console.log(`\n   ✨ KUN I NY: ${onlyInNew.join(', ')}`)
    }
  }

  console.log('\n=====================================')
  console.log('✅ SAMMENLIGNING FULLFØRT')
  console.log('=====================================\n')
}

compareDatabases()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 FEIL:', err)
    process.exit(1)
  })

// scripts/migration/migrate-portal-data.ts
// Migrerer KUN job portal data (ikke CRM) fra gammel til ny Supabase

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const OLD_URL = process.env.SOURCE_SUPABASE_URL!
const OLD_KEY = process.env.SOURCE_SUPABASE_KEY!
const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const oldClient = createClient(OLD_URL, OLD_KEY)
const newClient = createClient(NEW_URL, NEW_KEY)

async function migratePortalData() {
  console.log('🚀 PORTAL DATA MIGRATION')
  console.log('=====================================')
  console.log('Migrerer: job_postings, job_applications, interest_leads, contacts')
  console.log('IGNORERER: CRM-data (starter fra 0)')
  console.log('=====================================\n')

  // 1. Sjekk at tabeller eksisterer i ny DB
  console.log('🔍 Sjekker tabeller i ny DB...')
  
  const tables = ['job_postings', 'job_applications', 'interest_leads', 'portal_contacts']
  const missingTables: string[] = []
  
  for (const table of tables) {
    const { error } = await newClient.from(table).select('id').limit(1)
    if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
      missingTables.push(table)
      console.log(`   ❌ ${table}: MANGLER`)
    } else {
      console.log(`   ✅ ${table}: OK`)
    }
  }

  if (missingTables.length > 0) {
    console.log('\n⚠️  STOPP! Følgende tabeller mangler:')
    console.log(`   ${missingTables.join(', ')}`)
    console.log('\n   Kjør migration 00027_bluecrew_portal.sql først!')
    console.log('   → Supabase Dashboard → SQL Editor')
    return
  }

  // 2. Migrer job_postings
  console.log('\n📋 MIGRERER JOB_POSTINGS...')
  await migrateJobPostings()

  // 3. Migrer job_applications
  console.log('\n📋 MIGRERER JOB_APPLICATIONS...')
  await migrateJobApplications()

  // 4. Migrer interest_leads
  console.log('\n📋 MIGRERER INTEREST_LEADS...')
  await migrateInterestLeads()

  // 5. Migrer contacts → portal_contacts
  console.log('\n📋 MIGRERER CONTACTS...')
  await migrateContacts()

  // 6. Synk manglende kandidater
  console.log('\n📋 SYNKER MANGLENDE KANDIDATER...')
  await syncMissingCandidates()

  console.log('\n=====================================')
  console.log('✅ PORTAL MIGRATION FULLFØRT!')
  console.log('=====================================\n')
}

async function migrateJobPostings() {
  const { data: oldData, count } = await oldClient
    .from('job_postings')
    .select('*', { count: 'exact' })

  console.log(`   Fant ${count || 0} stillinger i gammel DB`)

  if (!oldData || oldData.length === 0) return

  let migrated = 0, skipped = 0, errors = 0

  for (const item of oldData) {
    // Sjekk om eksisterer (via slug)
    const { data: existing } = await newClient
      .from('job_postings')
      .select('id')
      .eq('slug', item.slug)
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Fjern felt som ikke matcher ny schema
    const { customer_id, created_by, ...insertData } = item

    const { error } = await newClient.from('job_postings').insert(insertData)

    if (error) {
      console.log(`   ❌ ${item.slug}: ${error.message}`)
      errors++
    } else {
      migrated++
    }
  }

  console.log(`   ✅ Migrert: ${migrated}, Hoppet: ${skipped}, Feil: ${errors}`)
}

async function migrateJobApplications() {
  const { data: oldData, count } = await oldClient
    .from('job_applications')
    .select('*', { count: 'exact' })

  console.log(`   Fant ${count || 0} søknader i gammel DB`)

  if (!oldData || oldData.length === 0) return

  let migrated = 0, skipped = 0, errors = 0

  for (const item of oldData) {
    // Sjekk om eksisterer
    const { data: existing } = await newClient
      .from('job_applications')
      .select('id')
      .eq('id', item.id)
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Map candidate_id via legacy_id
    let candidateId = null
    if (item.candidate_id) {
      const { data: candidate } = await newClient
        .from('candidates')
        .select('id')
        .eq('legacy_id', item.candidate_id)
        .single()
      candidateId = candidate?.id || null
    }

    // Fjern felt som ikke matcher
    const { candidate_id, reviewed_by, clerk_user_id, ...rest } = item

    const { error } = await newClient
      .from('job_applications')
      .insert({ ...rest, candidate_id: candidateId })

    if (error) {
      console.log(`   ❌ ${item.email}: ${error.message}`)
      errors++
    } else {
      migrated++
    }
  }

  console.log(`   ✅ Migrert: ${migrated}, Hoppet: ${skipped}, Feil: ${errors}`)
}

async function migrateInterestLeads() {
  const { data: oldData, count } = await oldClient
    .from('interest_leads')
    .select('*', { count: 'exact' })

  console.log(`   Fant ${count || 0} leads i gammel DB`)

  if (!oldData || oldData.length === 0) return

  let migrated = 0, skipped = 0, errors = 0

  for (const item of oldData) {
    const { data: existing } = await newClient
      .from('interest_leads')
      .select('id')
      .eq('id', item.id)
      .single()

    if (existing) {
      skipped++
      continue
    }

    const { error } = await newClient.from('interest_leads').insert(item)

    if (error) {
      console.log(`   ❌ ${item.epost}: ${error.message}`)
      errors++
    } else {
      migrated++
    }
  }

  console.log(`   ✅ Migrert: ${migrated}, Hoppet: ${skipped}, Feil: ${errors}`)
}

async function migrateContacts() {
  const { data: oldData, count } = await oldClient
    .from('contacts')
    .select('*', { count: 'exact' })

  console.log(`   Fant ${count || 0} kontakter i gammel DB`)

  if (!oldData || oldData.length === 0) return

  let migrated = 0, skipped = 0, errors = 0

  for (const item of oldData) {
    const { data: existing } = await newClient
      .from('portal_contacts')
      .select('id')
      .eq('id', item.id)
      .single()

    if (existing) {
      skipped++
      continue
    }

    const { error } = await newClient.from('portal_contacts').insert(item)

    if (error) {
      console.log(`   ❌ ${item.epost}: ${error.message}`)
      errors++
    } else {
      migrated++
    }
  }

  console.log(`   ✅ Migrert: ${migrated}, Hoppet: ${skipped}, Feil: ${errors}`)
}

async function syncMissingCandidates() {
  // Finn kandidater i gammel som ikke finnes i ny
  const { data: oldCandidates } = await oldClient
    .from('candidates')
    .select('id, email, name, first_name, last_name')

  const { data: newCandidates } = await newClient
    .from('candidates')
    .select('legacy_id, email')

  if (!oldCandidates || !newCandidates) {
    console.log('   ❌ Kunne ikke hente kandidater')
    return
  }

  const newLegacyIds = new Set(newCandidates.map(c => c.legacy_id))
  const newEmails = new Set(newCandidates.map(c => c.email?.toLowerCase()))

  const missing = oldCandidates.filter(c => 
    !newLegacyIds.has(c.id) && !newEmails.has(c.email?.toLowerCase())
  )

  console.log(`   Fant ${missing.length} manglende kandidater`)

  if (missing.length === 0) return

  let migrated = 0, errors = 0

  for (const old of missing) {
    // Hent full kandidat
    const { data: fullCandidate } = await oldClient
      .from('candidates')
      .select('*')
      .eq('id', old.id)
      .single()

    if (!fullCandidate) continue

    // Map til ny struktur
    const mapped = mapCandidateFields(fullCandidate)

    const { error } = await newClient.from('candidates').insert({
      ...mapped,
      legacy_id: fullCandidate.id,
      legacy_source: 'bluecrew_v3',
      compliance_status: 'not_started'
    })

    if (error) {
      console.log(`   ❌ ${old.email}: ${error.message}`)
      errors++
    } else {
      migrated++
      console.log(`   ✅ ${old.name || old.email}`)
    }
  }

  console.log(`   Migrert: ${migrated}, Feil: ${errors}`)
}

function mapCandidateFields(old: any) {
  // Splitt name til first_name/last_name hvis nødvendig
  let firstName = old.first_name
  let lastName = old.last_name
  
  if (!firstName && old.name) {
    const parts = old.name.split(' ')
    firstName = parts[0]
    lastName = parts.slice(1).join(' ')
  }

  return {
    first_name: firstName || 'Ukjent',
    last_name: lastName || '',
    email: old.email,
    phone: old.phone || old.mobile,
    date_of_birth: old.date_of_birth,
    nationality: old.nationality || 'NO',
    fylke: old.fylke || old.county,
    kommune: old.kommune || old.municipality,
    address_city: old.city || old.kommune,
    address_country: old.country || 'NO',
    primary_role: mapRole(old.rolle || old.primary_rank),
    experience_years: old.years_of_experience || old.erfaring || 0,
    availability_status: mapAvailability(old.available_from, old.tilgjengelighet),
    availability_date: old.available_from,
    cv_file_path: old.cv_key,
    source: 'bluecrew_website',
  }
}

function mapRole(role: string | null): string {
  if (!role) return 'deckhand'
  const r = role.toLowerCase()
  const map: Record<string, string> = {
    'kaptein': 'captain', 'skipsfører': 'captain',
    'styrmann': 'mate', 'overstyrmann': 'chief_mate',
    'maskinist': 'engineer', 'maskinsjef': 'chief_engineer',
    'dekksmann': 'deckhand', 'matros': 'able_seaman',
    'kokk': 'cook', 'steward': 'steward',
  }
  return map[r] || 'deckhand'
}

function mapAvailability(date: string | null, status: string | null): string {
  if (status) {
    const s = status.toLowerCase()
    if (s.includes('tilgjengelig') || s.includes('ledig')) return 'available'
    if (s.includes('snart')) return 'available_soon'
    if (s.includes('opptatt')) return 'on_assignment'
  }
  if (date) {
    const d = new Date(date)
    const now = new Date()
    if (d <= now) return 'available'
    if (d <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)) return 'available_soon'
  }
  return 'inactive'
}

// Kjør
migratePortalData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 FEIL:', err)
    process.exit(1)
  })

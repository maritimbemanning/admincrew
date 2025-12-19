// scripts/migration/migrate-bluecrew-data.ts
// Migrerer alle data fra gammel bluecrew Supabase til ny admincrew Supabase

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY)
const targetClient = createClient(TARGET_URL, TARGET_KEY)

interface MigrationStats {
  table: string
  source_count: number
  migrated: number
  skipped: number
  errors: string[]
}

async function migrateBluecrewData() {
  console.log('🚀 BLUECREW DATA MIGRATION')
  console.log('=====================================')
  console.log(`Source: ${SOURCE_URL}`)
  console.log(`Target: ${TARGET_URL}`)
  console.log('=====================================\n')

  const stats: MigrationStats[] = []

  // 1. Migrer job_postings
  console.log('📋 MIGRERER JOB_POSTINGS...')
  stats.push(await migrateJobPostings())

  // 2. Migrer job_applications
  console.log('\n📋 MIGRERER JOB_APPLICATIONS...')
  stats.push(await migrateJobApplications())

  // 3. Migrer contacts
  console.log('\n📋 MIGRERER CONTACTS...')
  stats.push(await migrateContacts())

  // 4. Migrer interest_leads
  console.log('\n📋 MIGRERER INTEREST_LEADS...')
  stats.push(await migrateInterestLeads())

  // 5. Migrer staffing_needs
  console.log('\n📋 MIGRERER STAFFING_NEEDS...')
  stats.push(await migrateStaffingNeeds())

  // Oppsummering
  console.log('\n=====================================')
  console.log('📊 MIGRASJON FULLFØRT!')
  console.log('=====================================')
  
  let totalErrors = 0
  stats.forEach(s => {
    console.log(`${s.table}: ${s.migrated}/${s.source_count} migrert, ${s.skipped} hoppet, ${s.errors.length} feil`)
    totalErrors += s.errors.length
  })

  if (totalErrors > 0) {
    console.log('\n⚠️ FEIL:')
    stats.forEach(s => {
      s.errors.forEach(e => console.log(`  - [${s.table}] ${e}`))
    })
  }
}

async function migrateJobPostings(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: 'job_postings',
    source_count: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  }

  try {
    // Hent fra source
    const { data: sourceData, error: fetchError, count } = await sourceClient
      .from('job_postings')
      .select('*', { count: 'exact' })

    if (fetchError) {
      stats.errors.push(`Fetch error: ${fetchError.message}`)
      return stats
    }

    stats.source_count = count || sourceData?.length || 0
    console.log(`  Fant ${stats.source_count} stillinger`)

    if (!sourceData || sourceData.length === 0) return stats

    for (const item of sourceData) {
      try {
        // Sjekk om eksisterer
        const { data: existing } = await targetClient
          .from('job_postings')
          .select('id')
          .eq('slug', item.slug)
          .single()

        if (existing) {
          stats.skipped++
          continue
        }

        // Map fields (fjern customer_id, created_by som kanskje ikke eksisterer)
        const { customer_id, created_by, ...insertData } = item

        const { error: insertError } = await targetClient
          .from('job_postings')
          .insert(insertData)

        if (insertError) {
          stats.errors.push(`${item.slug}: ${insertError.message}`)
        } else {
          stats.migrated++
        }
      } catch (err: any) {
        stats.errors.push(`${item.slug}: ${err.message}`)
      }
    }
  } catch (err: any) {
    stats.errors.push(`General error: ${err.message}`)
  }

  console.log(`  ✅ Migrert: ${stats.migrated}, Hoppet: ${stats.skipped}, Feil: ${stats.errors.length}`)
  return stats
}

async function migrateJobApplications(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: 'job_applications',
    source_count: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  }

  try {
    const { data: sourceData, count } = await sourceClient
      .from('job_applications')
      .select('*', { count: 'exact' })

    stats.source_count = count || sourceData?.length || 0
    console.log(`  Fant ${stats.source_count} søknader`)

    if (!sourceData || sourceData.length === 0) return stats

    for (const item of sourceData) {
      try {
        // Sjekk om eksisterer (samme email + job)
        const { data: existing } = await targetClient
          .from('job_applications')
          .select('id')
          .eq('job_posting_id', item.job_posting_id)
          .eq('email', item.email)
          .single()

        if (existing) {
          stats.skipped++
          continue
        }

        // Map candidate_id via legacy_id
        let candidateId = null
        if (item.candidate_id) {
          const { data: candidate } = await targetClient
            .from('candidates')
            .select('id')
            .eq('legacy_id', item.candidate_id)
            .single()
          candidateId = candidate?.id || null
        }

        const { candidate_id, reviewed_by, clerk_user_id, ...insertData } = item

        const { error: insertError } = await targetClient
          .from('job_applications')
          .insert({
            ...insertData,
            candidate_id: candidateId
          })

        if (insertError) {
          stats.errors.push(`${item.email}: ${insertError.message}`)
        } else {
          stats.migrated++
        }
      } catch (err: any) {
        stats.errors.push(`${item.email}: ${err.message}`)
      }
    }
  } catch (err: any) {
    stats.errors.push(`General error: ${err.message}`)
  }

  console.log(`  ✅ Migrert: ${stats.migrated}, Hoppet: ${stats.skipped}, Feil: ${stats.errors.length}`)
  return stats
}

async function migrateContacts(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: 'contacts → portal_contacts',
    source_count: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  }

  try {
    const { data: sourceData, count } = await sourceClient
      .from('contacts')
      .select('*', { count: 'exact' })

    stats.source_count = count || sourceData?.length || 0
    console.log(`  Fant ${stats.source_count} kontakter`)

    if (!sourceData || sourceData.length === 0) return stats

    for (const item of sourceData) {
      try {
        // Sjekk om eksisterer (same id)
        const { data: existing } = await targetClient
          .from('portal_contacts')
          .select('id')
          .eq('id', item.id)
          .single()

        if (existing) {
          stats.skipped++
          continue
        }

        const { error: insertError } = await targetClient
          .from('portal_contacts')
          .insert(item)

        if (insertError) {
          stats.errors.push(`${item.epost}: ${insertError.message}`)
        } else {
          stats.migrated++
        }
      } catch (err: any) {
        stats.errors.push(`${item.epost}: ${err.message}`)
      }
    }
  } catch (err: any) {
    stats.errors.push(`General error: ${err.message}`)
  }

  console.log(`  ✅ Migrert: ${stats.migrated}, Hoppet: ${stats.skipped}, Feil: ${stats.errors.length}`)
  return stats
}

async function migrateInterestLeads(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: 'interest_leads',
    source_count: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  }

  try {
    const { data: sourceData, count } = await sourceClient
      .from('interest_leads')
      .select('*', { count: 'exact' })

    stats.source_count = count || sourceData?.length || 0
    console.log(`  Fant ${stats.source_count} leads`)

    if (!sourceData || sourceData.length === 0) return stats

    for (const item of sourceData) {
      try {
        const { data: existing } = await targetClient
          .from('interest_leads')
          .select('id')
          .eq('id', item.id)
          .single()

        if (existing) {
          stats.skipped++
          continue
        }

        const { error: insertError } = await targetClient
          .from('interest_leads')
          .insert(item)

        if (insertError) {
          stats.errors.push(`${item.epost}: ${insertError.message}`)
        } else {
          stats.migrated++
        }
      } catch (err: any) {
        stats.errors.push(`${item.epost}: ${err.message}`)
      }
    }
  } catch (err: any) {
    stats.errors.push(`General error: ${err.message}`)
  }

  console.log(`  ✅ Migrert: ${stats.migrated}, Hoppet: ${stats.skipped}, Feil: ${stats.errors.length}`)
  return stats
}

async function migrateStaffingNeeds(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: 'staffing_needs',
    source_count: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  }

  try {
    const { data: sourceData, count } = await sourceClient
      .from('staffing_needs')
      .select('*', { count: 'exact' })

    stats.source_count = count || sourceData?.length || 0
    console.log(`  Fant ${stats.source_count} bemanningsbehov`)

    if (!sourceData || sourceData.length === 0) return stats

    for (const item of sourceData) {
      try {
        const { data: existing } = await targetClient
          .from('staffing_needs')
          .select('id')
          .eq('id', item.id)
          .single()

        if (existing) {
          stats.skipped++
          continue
        }

        const { error: insertError } = await targetClient
          .from('staffing_needs')
          .insert(item)

        if (insertError) {
          stats.errors.push(`${item.kontakt_epost}: ${insertError.message}`)
        } else {
          stats.migrated++
        }
      } catch (err: any) {
        stats.errors.push(`${item.kontakt_epost}: ${err.message}`)
      }
    }
  } catch (err: any) {
    stats.errors.push(`General error: ${err.message}`)
  }

  console.log(`  ✅ Migrert: ${stats.migrated}, Hoppet: ${stats.skipped}, Feil: ${stats.errors.length}`)
  return stats
}

// Kjør
migrateBluecrewData()
  .then(() => {
    console.log('\n✅ Ferdig!')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n💥 KRITISK FEIL:', err)
    process.exit(1)
  })

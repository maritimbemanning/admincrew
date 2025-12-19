// scripts/migration/batch-migration.ts
// FULL MIGRATION: Migrer alle kandidater i batch (100 om gangen)
// Kjør KUN etter at test-migration.ts har kjørt vellykket!

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY)
const targetClient = createClient(TARGET_URL, TARGET_KEY)

const BATCH_SIZE = 100
const PAUSE_MS = 2000 // 2 sekunder mellom hver batch

interface BatchResult {
  batch_number: number
  offset: number
  processed: number
  created: number
  updated: number
  skipped: number
  errors: string[]
  timestamp: string
}

interface FullMigrationResult {
  total_batches: number
  total_processed: number
  total_created: number
  total_updated: number
  total_skipped: number
  total_errors: number
  batches: BatchResult[]
  duration_seconds: number
}

async function fullMigration(): Promise<FullMigrationResult> {
  const startTime = Date.now()
  const result: FullMigrationResult = {
    total_batches: 0,
    total_processed: 0,
    total_created: 0,
    total_updated: 0,
    total_skipped: 0,
    total_errors: 0,
    batches: [],
    duration_seconds: 0
  }

  console.log('🚀 FULL MIGRATION STARTER')
  console.log('=====================================\n')

  try {
    // 1. Få totalt antall kandidater
    const { count, error: countError } = await sourceClient
      .from('candidates')
      .select('*', { count: 'exact', head: true })

    if (countError || !count) {
      throw new Error(`Kunne ikke hente antall kandidater: ${countError?.message}`)
    }

    const totalCandidates = count
    const totalBatches = Math.ceil(totalCandidates / BATCH_SIZE)

    console.log(`📊 Totalt ${totalCandidates} kandidater`)
    console.log(`📦 ${totalBatches} batches (${BATCH_SIZE} per batch)\n`)

    // Bekreftelse
    console.log('⚠️  VIKTIG: Dette vil migrere ALLE kandidater!')
    console.log('⚠️  Trykk Ctrl+C for å avbryte nå...\n')
    await sleep(5000) // 5 sekunders pause for å kunne avbryte

    // 2. Prosesser hver batch
    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
      const offset = (batchNum - 1) * BATCH_SIZE
      
      console.log(`\n📦 BATCH ${batchNum}/${totalBatches} (offset: ${offset})`)
      console.log('─────────────────────────────────────')

      const batchResult = await processBatch(batchNum, offset)
      result.batches.push(batchResult)
      
      result.total_processed += batchResult.processed
      result.total_created += batchResult.created
      result.total_updated += batchResult.updated
      result.total_skipped += batchResult.skipped
      result.total_errors += batchResult.errors.length

      // Logging
      console.log(`  ✅ Opprettet: ${batchResult.created}`)
      console.log(`  🔄 Oppdatert: ${batchResult.updated}`)
      console.log(`  ⏭️  Hoppet over: ${batchResult.skipped}`)
      console.log(`  ❌ Feil: ${batchResult.errors.length}`)

      // Lagre batch log til fil
      saveBatchLog(batchResult)

      // Pause før neste batch (unntatt siste)
      if (batchNum < totalBatches) {
        console.log(`  ⏸️  Venter ${PAUSE_MS}ms...`)
        await sleep(PAUSE_MS)
      }
    }

    result.total_batches = totalBatches
    result.duration_seconds = Math.round((Date.now() - startTime) / 1000)

    // 3. Sammendrag
    console.log('\n\n=====================================')
    console.log('🎉 MIGRATION FULLFØRT!')
    console.log('=====================================')
    console.log(`⏱️  Varighet: ${result.duration_seconds} sekunder`)
    console.log(`📦 Batches: ${result.total_batches}`)
    console.log(`📊 Totalt prosessert: ${result.total_processed}`)
    console.log(`✅ Opprettet: ${result.total_created}`)
    console.log(`🔄 Oppdatert: ${result.total_updated}`)
    console.log(`⏭️  Hoppet over: ${result.total_skipped}`)
    console.log(`❌ Feil: ${result.total_errors}`)

    // Lagre full rapport
    saveFullReport(result)

    return result

  } catch (error: any) {
    console.error('\n💥 KRITISK FEIL:', error.message)
    throw error
  }
}

async function processBatch(batchNum: number, offset: number): Promise<BatchResult> {
  const batchResult: BatchResult = {
    batch_number: batchNum,
    offset,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    timestamp: new Date().toISOString()
  }

  try {
    // Hent batch fra source
    const { data: sourceCandidates, error: fetchError } = await sourceClient
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (fetchError) {
      batchResult.errors.push(`Fetch error: ${fetchError.message}`)
      return batchResult
    }

    if (!sourceCandidates || sourceCandidates.length === 0) {
      return batchResult
    }

    // Prosesser hver kandidat
    for (const sourceCandidate of sourceCandidates) {
      batchResult.processed++

      try {
        const mappedCandidate = mapCandidateFields(sourceCandidate)

        // Valider email
        if (!mappedCandidate.email) {
          batchResult.skipped++
          batchResult.errors.push(`${sourceCandidate.id}: Mangler email`)
          continue
        }

        // Sjekk om eksisterer
        const { data: existing } = await targetClient
          .from('candidates')
          .select('id, updated_at')
          .eq('bluecrew_id', sourceCandidate.id)
          .single()

        if (existing) {
          // Oppdater
          const { error: updateError } = await targetClient
            .from('candidates')
            .update({
              ...mappedCandidate,
              updated_at: new Date().toISOString(),
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            })
            .eq('bluecrew_id', sourceCandidate.id)

          if (updateError) {
            batchResult.errors.push(`${sourceCandidate.id}: Update feil - ${updateError.message}`)
          } else {
            batchResult.updated++
          }
        } else {
          // Insert
          const { error: insertError } = await targetClient
            .from('candidates')
            .insert({
              ...mappedCandidate,
              bluecrew_id: sourceCandidate.id,
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
              compliance_status: 'not_started',
              status: 'active'
            })

          if (insertError) {
            batchResult.errors.push(`${sourceCandidate.id}: Insert feil - ${insertError.message}`)
          } else {
            batchResult.created++
          }
        }

      } catch (err: any) {
        batchResult.errors.push(`${sourceCandidate.id}: ${err.message}`)
      }
    }

  } catch (error: any) {
    batchResult.errors.push(`Batch error: ${error.message}`)
  }

  return batchResult
}

function mapCandidateFields(source: any) {
  return {
    first_name: source.first_name || source.fornavn || null,
    last_name: source.last_name || source.etternavn || null,
    email: source.email || null,
    phone: source.phone || source.telefon || null,
    date_of_birth: source.date_of_birth || source.fodselsdato || null,
    nationality: source.nationality || source.nasjonalitet || 'Norwegian',
    address_street: source.address?.street || source.adresse?.gate || null,
    address_city: source.address?.city || source.adresse?.by || null,
    address_postal_code: source.address?.postal_code || source.adresse?.postnummer || null,
    address_country: source.address?.country || source.adresse?.land || 'Norway',
    primary_role: mapRole(source.primary_role || source.rolle),
    secondary_roles: Array.isArray(source.secondary_roles) 
      ? source.secondary_roles.map(mapRole).filter(Boolean)
      : [],
    experience_years: source.experience_years || source.erfaring_ar || 0,
    availability_status: mapAvailability(source.availability || source.tilgjengelighet),
    available_from: source.available_from || source.ledig_fra || null,
    preferred_work_schedule: source.preferred_schedule || source.turnus || null,
    profile_image_url: source.profile_image_url || source.bilde_url || null,
    cv_url: source.cv_url || null,
    bio: source.bio || source.om_meg || null,
  }
}

function mapRole(role: string | null | undefined): string {
  if (!role) return 'deckhand'
  const normalized = role.toLowerCase().trim()
  const roleMap: Record<string, string> = {
    'kaptein': 'captain', 'skipsfører': 'captain',
    'styrmann': 'mate', 'overstyrmann': 'chief_mate',
    'maskinist': 'engineer', 'maskinsjef': 'chief_engineer',
    'dekksmann': 'deckhand', 'lettmatros': 'ordinary_seaman',
    'matros': 'able_seaman', 'fullmatros': 'able_seaman',
    'kokk': 'cook', 'steward': 'steward',
    'elektriker': 'electrician',
  }
  return roleMap[normalized] || 'deckhand'
}

function mapAvailability(status: string | null | undefined): string {
  if (!status) return 'inactive'
  const normalized = status.toLowerCase().trim()
  const statusMap: Record<string, string> = {
    'tilgjengelig': 'available', 'ledig': 'available',
    'snart_ledig': 'available_soon', 'snart ledig': 'available_soon',
    'opptatt': 'on_assignment', 'på oppdrag': 'on_assignment',
    'ikke_tilgjengelig': 'unavailable', 'inactive': 'inactive',
  }
  return statusMap[normalized] || 'inactive'
}

function saveBatchLog(batch: BatchResult) {
  const logDir = path.join(process.cwd(), 'scripts', 'migration', 'logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  
  const filename = `batch_${batch.batch_number.toString().padStart(4, '0')}.json`
  const filepath = path.join(logDir, filename)
  fs.writeFileSync(filepath, JSON.stringify(batch, null, 2))
}

function saveFullReport(result: FullMigrationResult) {
  const logDir = path.join(process.cwd(), 'scripts', 'migration', 'logs')
  const filepath = path.join(logDir, 'full_migration_report.json')
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2))
  console.log(`\n📄 Full rapport lagret: ${filepath}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Kjør migration
fullMigration()
  .then(result => {
    if (result.total_errors === 0) {
      console.log('\n✅ MIGRATION VELLYKKET - Ingen feil!')
      process.exit(0)
    } else {
      console.log(`\n⚠️  MIGRATION FULLFØRT MED ${result.total_errors} FEIL`)
      console.log('Sjekk loggene for detaljer.')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('\n💥 MIGRATION FEILET:', err)
    process.exit(1)
  })

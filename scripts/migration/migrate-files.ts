/**
 * Migrate Files from bluecrew.no Storage to AdminCrew V2
 *
 * This script migrates uploaded CV and certificate files from the source
 * Supabase storage to the target storage, and updates candidate records.
 *
 * Source buckets (bluecrew.no):
 *   - candidate-cvs
 *   - candidate-certificates
 *
 * Target bucket (admincrew):
 *   - candidate-documents (with subfolders: cvs/, certificates/)
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-files.ts [--dry-run] [--limit=N] [--type=cv|cert|all]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT_ARG = args.find((arg) => arg.startsWith('--limit='))
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : undefined
const TYPE_ARG = args.find((arg) => arg.startsWith('--type='))
const TYPE = TYPE_ARG ? TYPE_ARG.split('=')[1] : 'all'

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════════════════

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const targetClient = createClient(TARGET_URL, TARGET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface CandidateFile {
  legacy_id: string
  target_id: string
  source_path: string
  source_bucket: string
  target_path: string
  target_bucket: string
  file_type: 'cv' | 'certificate'
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract filename from a storage path
 */
function getFileName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] || 'file'
}

/**
 * Generate target path for a file
 */
function generateTargetPath(candidateId: string, fileType: 'cv' | 'certificate', originalPath: string): string {
  const fileName = getFileName(originalPath)
  const folder = fileType === 'cv' ? 'cvs' : 'certificates'
  return `${folder}/${candidateId}/${fileName}`
}

/**
 * Download file from source storage
 */
async function downloadFile(bucket: string, path: string): Promise<Blob | null> {
  const { data, error } = await sourceClient.storage.from(bucket).download(path)

  if (error) {
    console.error(`    ERROR downloading ${bucket}/${path}:`, error.message)
    return null
  }

  return data
}

/**
 * Upload file to target storage
 */
async function uploadFile(bucket: string, path: string, file: Blob): Promise<boolean> {
  const { error } = await targetClient.storage.from(bucket).upload(path, file, {
    upsert: true,
  })

  if (error) {
    console.error(`    ERROR uploading ${bucket}/${path}:`, error.message)
    return false
  }

  return true
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION
// ═══════════════════════════════════════════════════════════════════════════════

async function migrate() {
  console.log('\n========================================')
  console.log('  FIL-MIGRERING: bluecrew.no -> admincrew v2')
  console.log('========================================\n')

  if (DRY_RUN) {
    console.log('>>> DRY RUN MODE <<<\n')
  }

  console.log(`Type: ${TYPE}`)
  if (LIMIT) console.log(`Limit: ${LIMIT}`)
  console.log('')

  // Validate
  if (!SOURCE_URL || !SOURCE_KEY || !TARGET_URL || !TARGET_KEY) {
    console.error('ERROR: Mangler environment variables')
    process.exit(1)
  }

  // Step 1: Get legacy_id → target_id mapping
  console.log('1. Henter kandidat-mapping fra admincrew v2...')

  const { data: candidates, error: candError } = await targetClient
    .from('candidates')
    .select('id, legacy_id, cv_file_path')
    .not('legacy_id', 'is', null)

  if (candError) {
    console.error('ERROR:', candError.message)
    process.exit(1)
  }

  const legacyToTarget = new Map<string, { id: string; cv_file_path: string | null }>()
  candidates?.forEach((c) => {
    if (c.legacy_id) {
      legacyToTarget.set(c.legacy_id, { id: c.id, cv_file_path: c.cv_file_path })
    }
  })

  console.log(`  ${legacyToTarget.size} migrerte kandidater funnet`)

  // Step 2: Fetch source candidates with file references
  console.log('\n2. Henter kandidater med filer fra bluecrew.no...')

  let query = sourceClient.from('candidates').select('id, name, cv_key, certs_key')

  if (TYPE === 'cv') {
    query = query.not('cv_key', 'is', null)
  } else if (TYPE === 'cert') {
    query = query.not('certs_key', 'is', null)
  } else {
    query = query.or('cv_key.not.is.null,certs_key.not.is.null')
  }

  if (LIMIT) {
    query = query.limit(LIMIT)
  }

  const { data: sourceCandidates, error: sourceError } = await query

  if (sourceError) {
    console.error('ERROR:', sourceError.message)
    process.exit(1)
  }

  console.log(`  ${sourceCandidates?.length || 0} kandidater med filer`)

  // Step 3: Build file list
  console.log('\n3. Bygger filliste...')

  const filesToMigrate: CandidateFile[] = []
  let skippedNoMapping = 0
  let skippedAlreadyMigrated = 0

  for (const source of sourceCandidates || []) {
    const targetInfo = legacyToTarget.get(source.id)

    if (!targetInfo) {
      skippedNoMapping++
      continue
    }

    // CV file
    if (source.cv_key && (TYPE === 'all' || TYPE === 'cv')) {
      // Check if already migrated (cv_file_path is set and not the old path)
      if (targetInfo.cv_file_path && !targetInfo.cv_file_path.startsWith('cv/')) {
        skippedAlreadyMigrated++
      } else {
        filesToMigrate.push({
          legacy_id: source.id,
          target_id: targetInfo.id,
          source_path: source.cv_key,
          source_bucket: 'candidate-cvs',
          target_path: generateTargetPath(targetInfo.id, 'cv', source.cv_key),
          target_bucket: 'candidate-documents',
          file_type: 'cv',
        })
      }
    }

    // Certificate file
    if (source.certs_key && (TYPE === 'all' || TYPE === 'cert')) {
      filesToMigrate.push({
        legacy_id: source.id,
        target_id: targetInfo.id,
        source_path: source.certs_key,
        source_bucket: 'candidate-certificates',
        target_path: generateTargetPath(targetInfo.id, 'certificate', source.certs_key),
        target_bucket: 'candidate-documents',
        file_type: 'certificate',
      })
    }
  }

  const cvCount = filesToMigrate.filter((f) => f.file_type === 'cv').length
  const certCount = filesToMigrate.filter((f) => f.file_type === 'certificate').length

  console.log(`  ${filesToMigrate.length} filer a migrere`)
  console.log(`    - CVer: ${cvCount}`)
  console.log(`    - Sertifikater: ${certCount}`)
  console.log(`  ${skippedNoMapping} kandidater ikke funnet i target`)
  console.log(`  ${skippedAlreadyMigrated} allerede migrert`)

  if (filesToMigrate.length === 0) {
    console.log('\nIngen filer a migrere.')
    return
  }

  // Step 4: Preview or migrate
  if (DRY_RUN) {
    console.log('\n4. DRY RUN - Forhandsvisning:')
    console.log('\n  Forste 10 filer:')
    filesToMigrate.slice(0, 10).forEach((f, i) => {
      console.log(`    [${i + 1}] ${f.file_type.toUpperCase()}`)
      console.log(`        Fra: ${f.source_bucket}/${f.source_path}`)
      console.log(`        Til: ${f.target_bucket}/${f.target_path}`)
    })
    console.log('\n>>> Kjor uten --dry-run for a utfore migreringen <<<')
    return
  }

  console.log('\n4. Migrerer filer...')

  let migrated = 0
  let failed = 0
  const cvUpdates: { id: string; path: string }[] = []

  for (let i = 0; i < filesToMigrate.length; i++) {
    const file = filesToMigrate[i]
    const progress = `[${i + 1}/${filesToMigrate.length}]`

    console.log(`  ${progress} ${file.file_type}: ${getFileName(file.source_path)}`)

    // Download from source
    const fileData = await downloadFile(file.source_bucket, file.source_path)
    if (!fileData) {
      failed++
      continue
    }

    // Upload to target
    const uploaded = await uploadFile(file.target_bucket, file.target_path, fileData)
    if (!uploaded) {
      failed++
      continue
    }

    migrated++

    // Track CV updates for database
    if (file.file_type === 'cv') {
      cvUpdates.push({ id: file.target_id, path: file.target_path })
    }

    // Progress indicator every 10 files
    if ((i + 1) % 10 === 0) {
      console.log(`    ... ${i + 1} filer behandlet`)
    }
  }

  // Step 5: Update candidate records with new CV paths
  if (cvUpdates.length > 0) {
    console.log('\n5. Oppdaterer kandidat-poster med nye fil-stier...')

    for (const update of cvUpdates) {
      const { error } = await targetClient
        .from('candidates')
        .update({ cv_file_path: update.path })
        .eq('id', update.id)

      if (error) {
        console.error(`  ERROR updating candidate ${update.id}:`, error.message)
      }
    }

    console.log(`  ${cvUpdates.length} kandidater oppdatert`)
  }

  // Summary
  console.log('\n========================================')
  console.log('  MIGRERING FULLFORT')
  console.log('========================================')
  console.log(`  Filer migrert:  ${migrated}`)
  console.log(`  Feilet:         ${failed}`)
  console.log('========================================\n')
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════

migrate().catch((err) => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})

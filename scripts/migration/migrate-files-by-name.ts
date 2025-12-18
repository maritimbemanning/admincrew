/**
 * Migrate Files by Name Matching from bluecrew.no Storage to AdminCrew V2
 *
 * Since cv_key/certs_key don't match actual storage paths, this script:
 * 1. Lists all files in the uploads/ folders
 * 2. Tries to match files to candidates by name patterns in filename
 * 3. Migrates matched files and updates candidate records
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-files-by-name.ts [--dry-run] [--limit=N]
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

interface FileMatch {
  fileName: string
  sourceBucket: string
  sourcePath: string
  candidateId: string
  candidateName: string
  fileType: 'cv' | 'certificate'
  targetPath: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize name for matching (lowercase, remove special chars)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Extract meaningful parts from filename
 */
function getFileNameParts(fileName: string): string[] {
  // Remove timestamp prefix and extension
  const cleaned = fileName
    .replace(/^\d+-[a-z0-9]+-/, '') // Remove timestamp-hash prefix
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')

  return normalizeName(cleaned).split(/\s+/).filter(p => p.length > 2)
}

/**
 * Calculate match score between filename and candidate name
 * Requires EXACT matches of name parts (not substrings) for better accuracy
 */
function calculateMatchScore(fileName: string, candidateName: string): number {
  const fileParts = getFileNameParts(fileName)
  const nameParts = normalizeName(candidateName).split(/\s+/)

  if (fileParts.length === 0 || nameParts.length === 0) return 0

  let exactMatches = 0
  let partialMatches = 0

  for (const namePart of nameParts) {
    if (namePart.length < 3) continue

    // Check for exact match
    if (fileParts.some(fp => fp === namePart)) {
      exactMatches++
    }
    // Check for partial match (one contains the other, but minimum 4 chars)
    else if (namePart.length >= 4 && fileParts.some(fp => fp.length >= 4 && (fp.includes(namePart) || namePart.includes(fp)))) {
      partialMatches++
    }
  }

  // Require at least 2 exact matches, or 1 exact + 1 partial for good match
  if (exactMatches >= 2) return 0.9
  if (exactMatches >= 1 && partialMatches >= 1) return 0.7
  if (exactMatches >= 1 && nameParts.filter(p => p.length >= 3).length <= 2) return 0.5

  return 0
}

/**
 * Check if file is a CV based on name
 */
function isCvFile(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return lower.includes('cv') || lower.includes('resume')
}

/**
 * Download file from source storage
 */
async function downloadFile(bucket: string, path: string): Promise<Blob | null> {
  const { data, error } = await sourceClient.storage.from(bucket).download(path)

  if (error) {
    console.error('    ERROR downloading ' + bucket + '/' + path + ':', error.message)
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
    console.error('    ERROR uploading ' + bucket + '/' + path + ':', error.message)
    return false
  }

  return true
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION
// ═══════════════════════════════════════════════════════════════════════════════

async function migrate() {
  console.log('\n========================================')
  console.log('  FILE MIGRATION BY NAME MATCHING')
  console.log('========================================\n')

  if (DRY_RUN) {
    console.log('>>> DRY RUN MODE <<<\n')
  }

  if (LIMIT) console.log('Limit: ' + LIMIT)
  console.log('')

  // Validate
  if (!SOURCE_URL || !SOURCE_KEY || !TARGET_URL || !TARGET_KEY) {
    console.error('ERROR: Missing environment variables')
    process.exit(1)
  }

  // Step 1: Get all candidates from target (migrated candidates)
  console.log('1. Fetching migrated candidates from admincrew...')

  const { data: candidates, error: candError } = await targetClient
    .from('candidates')
    .select('id, legacy_id, first_name, last_name, cv_file_path')
    .not('legacy_id', 'is', null)

  if (candError) {
    console.error('ERROR:', candError.message)
    process.exit(1)
  }

  const candidateList = candidates || []
  console.log('  ' + candidateList.length + ' migrated candidates found')

  // Step 2: List all files in source storage
  console.log('\n2. Listing files in source storage...')

  // Get CV files (these have id set when they're actual files, null for folders)
  const { data: cvFiles } = await sourceClient.storage
    .from('candidate-cvs')
    .list('uploads', { limit: 500 })

  const cvFileList = (cvFiles || []).filter(f => f.id !== null) // Files have id set
  console.log('  ' + cvFileList.length + ' CV files found')

  // Get certificate files
  const { data: certFiles } = await sourceClient.storage
    .from('candidate-certificates')
    .list('uploads', { limit: 500 })

  const certFileList = (certFiles || []).filter(f => f.id !== null)
  console.log('  ' + certFileList.length + ' certificate files found')

  // Step 3: Match files to candidates
  console.log('\n3. Matching files to candidates...')

  const matches: FileMatch[] = []
  const unmatchedCvFiles: string[] = []
  const unmatchedCertFiles: string[] = []

  // Match CV files
  for (const file of cvFileList) {
    let bestMatch: { candidate: typeof candidateList[0]; score: number } | null = null

    for (const candidate of candidateList) {
      const fullName = candidate.first_name + ' ' + candidate.last_name
      const score = calculateMatchScore(file.name, fullName)

      if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { candidate, score }
      }
    }

    if (bestMatch) {
      const ext = file.name.split('.').pop() || 'pdf'
      matches.push({
        fileName: file.name,
        sourceBucket: 'candidate-cvs',
        sourcePath: 'uploads/' + file.name,
        candidateId: bestMatch.candidate.id,
        candidateName: bestMatch.candidate.first_name + ' ' + bestMatch.candidate.last_name,
        fileType: 'cv',
        targetPath: 'cvs/' + bestMatch.candidate.id + '/cv.' + ext,
      })
    } else {
      unmatchedCvFiles.push(file.name)
    }
  }

  // Match certificate files
  for (const file of certFileList) {
    let bestMatch: { candidate: typeof candidateList[0]; score: number } | null = null

    for (const candidate of candidateList) {
      const fullName = candidate.first_name + ' ' + candidate.last_name
      const score = calculateMatchScore(file.name, fullName)

      if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { candidate, score }
      }
    }

    if (bestMatch) {
      const ext = file.name.split('.').pop() || 'pdf'
      const cleanName = file.name.replace(/^\d+-[a-z0-9]+-/, '').replace(/\.[^.]+$/, '')
      matches.push({
        fileName: file.name,
        sourceBucket: 'candidate-certificates',
        sourcePath: 'uploads/' + file.name,
        candidateId: bestMatch.candidate.id,
        candidateName: bestMatch.candidate.first_name + ' ' + bestMatch.candidate.last_name,
        fileType: 'certificate',
        targetPath: 'certificates/' + bestMatch.candidate.id + '/' + cleanName.substring(0, 50) + '.' + ext,
      })
    } else {
      unmatchedCertFiles.push(file.name)
    }
  }

  // Deduplicate: keep only the latest file per candidate per type
  // Files are sorted by timestamp in filename, so later ones are newer
  const deduplicatedMatches: FileMatch[] = []
  const seenKeys = new Set<string>()

  // Process in reverse so we encounter newest files first
  const sortedMatches = [...matches].sort((a, b) => {
    // Extract timestamp from filename (first number before the dash)
    const tsA = parseInt(a.fileName.split('-')[0]) || 0
    const tsB = parseInt(b.fileName.split('-')[0]) || 0
    return tsB - tsA // Newest first
  })

  for (const match of sortedMatches) {
    const key = match.candidateId + ':' + match.fileType
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      deduplicatedMatches.push(match)
    }
  }

  const cvMatches = deduplicatedMatches.filter(m => m.fileType === 'cv')
  const certMatches = deduplicatedMatches.filter(m => m.fileType === 'certificate')

  console.log('  ' + matches.length + ' total file matches found')
  console.log('  ' + deduplicatedMatches.length + ' unique (after deduplication)')
  console.log('    - CVs: ' + cvMatches.length)
  console.log('    - Certificates: ' + certMatches.length)
  console.log('  ' + unmatchedCvFiles.length + ' CV files unmatched')
  console.log('  ' + unmatchedCertFiles.length + ' certificate files unmatched')

  // Apply limit if set
  const filesToMigrate = LIMIT ? deduplicatedMatches.slice(0, LIMIT) : deduplicatedMatches

  if (filesToMigrate.length === 0) {
    console.log('\nNo files to migrate.')
    return
  }

  // Step 4: Preview or migrate
  if (DRY_RUN) {
    console.log('\n4. DRY RUN - Preview:')
    console.log('\n  First 10 matched files:')
    filesToMigrate.slice(0, 10).forEach((m, i) => {
      console.log('    [' + (i + 1) + '] ' + m.fileType.toUpperCase())
      console.log('        File: ' + m.fileName)
      console.log('        Candidate: ' + m.candidateName)
      console.log('        Target: ' + m.targetPath)
    })

    if (unmatchedCvFiles.length > 0) {
      console.log('\n  Sample unmatched CV files:')
      unmatchedCvFiles.slice(0, 5).forEach(f => console.log('    - ' + f))
    }

    if (unmatchedCertFiles.length > 0) {
      console.log('\n  Sample unmatched certificate files:')
      unmatchedCertFiles.slice(0, 5).forEach(f => console.log('    - ' + f))
    }

    console.log('\n>>> Run without --dry-run to perform migration <<<')
    return
  }

  console.log('\n4. Migrating files...')

  let migrated = 0
  let failed = 0
  const cvUpdates: { id: string; path: string }[] = []

  for (let i = 0; i < filesToMigrate.length; i++) {
    const match = filesToMigrate[i]
    const progress = '[' + (i + 1) + '/' + filesToMigrate.length + ']'

    console.log('  ' + progress + ' ' + match.fileType + ': ' + match.candidateName)

    // Download from source
    const fileData = await downloadFile(match.sourceBucket, match.sourcePath)
    if (!fileData) {
      failed++
      continue
    }

    // Upload to target
    const uploaded = await uploadFile('candidate-documents', match.targetPath, fileData)
    if (!uploaded) {
      failed++
      continue
    }

    migrated++

    // Track CV updates
    if (match.fileType === 'cv') {
      cvUpdates.push({ id: match.candidateId, path: match.targetPath })
    }

    // Progress every 10 files
    if ((i + 1) % 10 === 0) {
      console.log('    ... ' + (i + 1) + ' files processed')
    }
  }

  // Step 5: Update candidate records with CV paths
  if (cvUpdates.length > 0) {
    console.log('\n5. Updating candidate records with CV paths...')

    for (const update of cvUpdates) {
      const { error } = await targetClient
        .from('candidates')
        .update({ cv_file_path: update.path })
        .eq('id', update.id)

      if (error) {
        console.error('  ERROR updating candidate ' + update.id + ':', error.message)
      }
    }

    console.log('  ' + cvUpdates.length + ' candidates updated')
  }

  // Summary
  console.log('\n========================================')
  console.log('  MIGRATION COMPLETE')
  console.log('========================================')
  console.log('  Files migrated:  ' + migrated)
  console.log('  Failed:          ' + failed)
  console.log('  CVs updated:     ' + cvUpdates.length)
  console.log('========================================\n')
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════

migrate().catch((err) => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})

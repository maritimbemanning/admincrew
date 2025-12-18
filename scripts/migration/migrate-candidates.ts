/**
 * Migrate Candidates from bluecrew.no to AdminCrew V2
 *
 * This script reads candidates from bluecrew.no (source) and migrates them
 * to the admincrew v2 database (target).
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-candidates.ts [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run  Preview what will be migrated without making changes
 *   --limit=N  Only migrate N candidates (useful for testing)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { mapRole, mapStatus, getDisplayName } from './role-mapping'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Source: bluecrew.no (uqwfesvsfiqjcpzwetkz)
const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!

// Target: admincrew v2 (zhqocakrwcqwxubbondi)
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Parse command line arguments
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

/**
 * Source candidate from bluecrew-v3 database
 * Based on actual schema in bluecrew-v3/database-schema.sql
 */
interface SourceCandidate {
  id: string
  created_at: string
  submitted_at?: string

  // Core identity
  name: string  // Full name (not split)
  email: string
  phone: string

  // Status & verification
  status?: string  // 'pending', 'godkjent', 'aktiv', 'inaktiv'
  verification_status?: string
  verified_at?: string

  // Location
  fylke?: string
  kommune?: string
  county?: string
  municipality?: string

  // Availability
  available_from?: string
  available_to?: string
  wants_temporary?: string

  // Professional qualifications - THIS IS THE KEY PART
  work_main?: string[]  // Array of job types like ['Matros', 'Kokk']
  stcw_has?: string     // STCW certificate type
  stcw_mod?: string[]   // STCW modules
  stcw_confirm?: boolean
  stcw_confirmed?: boolean
  deck_has?: string     // Deck certificate type
  deck_class?: string   // D1, D2, D3, D4, D5, D6
  skills?: string
  other_comp?: string

  // Documents (Supabase Storage keys)
  cv_key?: string
  certs_key?: string
  ocr_confidence_score?: number

  // BankID verification
  bankid_verified_at?: string
  national_id_hash?: string

  // Clerk integration
  clerk_user_id?: string

  // Encryption (for GDPR compliance)
  is_encrypted?: boolean
  name_encrypted?: string
  email_encrypted?: string
  phone_encrypted?: string

  // GDPR
  gdpr_consent?: boolean

  // Admin flags
  flagged_reason?: string
  archived_at?: string
}

interface TargetCandidate {
  legacy_id: string
  legacy_source: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  nationality?: string
  address_street?: string
  address_postal_code?: string
  address_city?: string
  address_country: string
  fylke?: string
  kommune?: string
  avatar_url?: string
  primary_role: string
  secondary_roles: string[]
  experience_years: number
  languages: any
  availability_status: string
  availability_date?: string
  compliance_status: string
  cv_file_path?: string
  internal_notes?: string
  tags: string[]
  source: string
  profile_completeness: number
  created_at: string
  updated_at: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse full name into first and last name
 * Bluecrew-v3 stores names as a single "name" field
 */
function parseName(fullName: string | null | undefined): { first: string; last: string } {
  if (!fullName || fullName.trim() === '') {
    return { first: 'Ukjent', last: '' }
  }

  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { first: parts[0], last: '' }
  }

  // First word is first name, rest is last name
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

/**
 * Calculate profile completeness score (0-100)
 */
function calculateCompleteness(candidate: SourceCandidate): number {
  let score = 0

  // Required fields (10 points each)
  if (candidate.email) score += 10
  if (candidate.phone) score += 10
  if (candidate.name) score += 10

  // Professional info (15 points each)
  if (candidate.work_main && candidate.work_main.length > 0) score += 15
  if (candidate.stcw_has || candidate.deck_class) score += 15

  // Documents (10 points each)
  if (candidate.cv_key) score += 10
  if (candidate.certs_key) score += 10

  // Location (5 points each)
  if (candidate.fylke) score += 5
  if (candidate.kommune) score += 5

  // Availability (5 points each)
  if (candidate.available_from) score += 5
  if (candidate.status && candidate.status !== 'pending') score += 5

  return Math.min(score, 100)
}

/**
 * Build internal notes from various source fields
 */
function buildInternalNotes(source: SourceCandidate): string {
  const notes: string[] = []

  if (source.skills) {
    notes.push(`Ferdigheter: ${source.skills}`)
  }
  if (source.other_comp) {
    notes.push(`Andre kompetanser: ${source.other_comp}`)
  }
  if (source.wants_temporary) {
    notes.push(`Oensker midlertidig: ${source.wants_temporary}`)
  }
  if (source.flagged_reason) {
    notes.push(`FLAGGET: ${source.flagged_reason}`)
  }
  if (source.stcw_has) {
    notes.push(`STCW: ${source.stcw_has}`)
  }
  if (source.stcw_mod && source.stcw_mod.length > 0) {
    notes.push(`STCW moduler: ${source.stcw_mod.join(', ')}`)
  }
  if (source.deck_has) {
    notes.push(`Dekk-sertifikat: ${source.deck_has}`)
  }
  if (source.deck_class) {
    notes.push(`Dekk-klasse: ${source.deck_class}`)
  }

  return notes.length > 0 ? notes.join('\n') : ''
}

/**
 * Build tags from source candidate data
 */
function buildTags(source: SourceCandidate): string[] {
  const tags: string[] = ['migrert']

  // Add deck class as tag
  if (source.deck_class) {
    tags.push(source.deck_class.toUpperCase())
  }

  // Add STCW as tag if present
  if (source.stcw_has) {
    tags.push('STCW')
  }

  // Add BankID verified tag
  if (source.bankid_verified_at) {
    tags.push('bankid-verifisert')
  }

  // Add flagged tag
  if (source.flagged_reason) {
    tags.push('flagget')
  }

  return tags
}

/**
 * Transform source candidate to target format
 */
function transformCandidate(source: SourceCandidate): TargetCandidate {
  const { first, last } = parseName(source.name)

  // Map work_main array to primary and secondary roles
  const workRoles = source.work_main || []
  const primaryRole = workRoles.length > 0 ? mapRole(workRoles[0]) : 'other'
  const secondaryRoles = workRoles
    .slice(1)
    .map(mapRole)
    .filter((r) => r !== primaryRole && r !== 'other')

  // Map status to availability
  const availabilityStatus = mapStatus(source.status)

  return {
    legacy_id: source.id,
    legacy_source: 'bluecrew_v3',
    first_name: first,
    last_name: last,
    email: source.email,
    phone: source.phone || undefined,
    date_of_birth: undefined, // Not stored in bluecrew-v3 candidates table
    nationality: 'NO',
    address_street: undefined,
    address_postal_code: undefined,
    address_city: source.kommune || undefined,
    address_country: 'NO',
    fylke: source.fylke || source.county || undefined,
    kommune: source.kommune || source.municipality || undefined,
    avatar_url: undefined, // Not stored in bluecrew-v3
    primary_role: primaryRole,
    secondary_roles: secondaryRoles,
    experience_years: 0, // Not stored in bluecrew-v3
    languages: [{ code: 'no', level: 'native' }],
    availability_status: availabilityStatus,
    availability_date: source.available_from || undefined,
    compliance_status: source.bankid_verified_at ? 'review_pending' : 'not_started',
    cv_file_path: source.cv_key || undefined,
    internal_notes: buildInternalNotes(source) || undefined,
    tags: buildTags(source),
    source: 'bluecrew_migration',
    profile_completeness: calculateCompleteness(source),
    created_at: source.created_at,
    updated_at: source.submitted_at || source.created_at,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION
// ═══════════════════════════════════════════════════════════════════════════════

async function migrate() {
  console.log('\n========================================')
  console.log('  KANDIDAT-MIGRERING: bluecrew.no -> admincrew v2')
  console.log('========================================\n')

  if (DRY_RUN) {
    console.log('>>> DRY RUN MODE - Ingen endringer vil bli gjort <<<\n')
  }

  // Validate configuration
  if (!SOURCE_URL || !SOURCE_KEY) {
    console.error('ERROR: SOURCE_SUPABASE_URL og SOURCE_SUPABASE_KEY ma vaere satt i .env.local')
    process.exit(1)
  }
  if (!TARGET_URL || !TARGET_KEY) {
    console.error(
      'ERROR: NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY ma vaere satt i .env.local'
    )
    process.exit(1)
  }

  console.log('Source:', SOURCE_URL)
  console.log('Target:', TARGET_URL)
  console.log('')

  // Step 1: Fetch candidates from source
  console.log('1. Henter kandidater fra bluecrew.no...')

  let query = sourceClient.from('profiles').select('*').order('created_at', { ascending: false })

  if (LIMIT) {
    query = query.limit(LIMIT)
  }

  const { data: sourceCandidates, error: fetchError } = await query

  if (fetchError) {
    console.error('ERROR fetching from source:', fetchError.message)
    // Try alternate table name
    console.log('Prover alternativt tabellnavn "candidates"...')
    const { data: altCandidates, error: altError } = await sourceClient
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(LIMIT || 1000)

    if (altError) {
      console.error('ERROR: Kunne ikke hente kandidater:', altError.message)
      process.exit(1)
    }

    if (!altCandidates || altCandidates.length === 0) {
      console.log('Ingen kandidater funnet i source database.')
      return
    }

    console.log(`  Funnet ${altCandidates.length} kandidater i "candidates" tabell`)

    await processCanidates(altCandidates)
    return
  }

  if (!sourceCandidates || sourceCandidates.length === 0) {
    console.log('Ingen kandidater funnet i source database.')
    return
  }

  console.log(`  Funnet ${sourceCandidates.length} kandidater`)

  await processCanidates(sourceCandidates)
}

async function processCanidates(sourceCandidates: any[]) {
  // Step 2: Check for existing candidates (by legacy_id)
  console.log('\n2. Sjekker eksisterende kandidater i target...')

  const { data: existingCandidates, error: existingError } = await targetClient
    .from('candidates')
    .select('legacy_id')
    .not('legacy_id', 'is', null)

  if (existingError) {
    console.error('ERROR checking existing candidates:', existingError.message)
    process.exit(1)
  }

  const existingIds = new Set((existingCandidates || []).map((c) => c.legacy_id))
  console.log(`  ${existingIds.size} kandidater allerede migrert`)

  // Step 3: Filter and transform candidates
  console.log('\n3. Transformerer kandidater...')

  const newCandidates = sourceCandidates
    .filter((c) => !existingIds.has(c.id))
    .map((c) => {
      try {
        return transformCandidate(c)
      } catch (err) {
        console.warn(`  WARN: Kunne ikke transformere kandidat ${c.id}:`, err)
        return null
      }
    })
    .filter(Boolean) as TargetCandidate[]

  console.log(`  ${newCandidates.length} nye kandidater a migrere`)
  console.log(`  ${sourceCandidates.length - newCandidates.length} allerede eksisterer eller feilet`)

  if (newCandidates.length === 0) {
    console.log('\nIngen nye kandidater a migrere. Ferdig!')
    return
  }

  // Step 4: Preview or insert
  if (DRY_RUN) {
    console.log('\n4. DRY RUN - Forhandsvisning av forste 5 kandidater:')
    newCandidates.slice(0, 5).forEach((c, i) => {
      console.log(`\n  [${i + 1}] ${c.first_name} ${c.last_name}`)
      console.log(`      Email: ${c.email}`)
      console.log(`      Rolle: ${getDisplayName(c.primary_role)}`)
      console.log(`      Erfaring: ${c.experience_years} ar`)
      console.log(`      Status: ${c.availability_status}`)
    })
    console.log('\n>>> Kjor uten --dry-run for a utfore migreringen <<<')
    return
  }

  console.log('\n4. Migrerer kandidater til admincrew v2...')

  // Insert in batches of 50
  const BATCH_SIZE = 50
  let inserted = 0
  let errors = 0

  for (let i = 0; i < newCandidates.length; i += BATCH_SIZE) {
    const batch = newCandidates.slice(i, i + BATCH_SIZE)

    const { data: insertedBatch, error: insertError } = await targetClient
      .from('candidates')
      .insert(batch)
      .select('id')

    if (insertError) {
      console.error(`  ERROR inserting batch ${i / BATCH_SIZE + 1}:`, insertError.message)
      errors += batch.length
    } else {
      inserted += insertedBatch?.length || 0
      console.log(
        `  Batch ${i / BATCH_SIZE + 1}: ${insertedBatch?.length || 0} kandidater migrert`
      )
    }
  }

  // Step 5: Summary
  console.log('\n========================================')
  console.log('  MIGRERING FULLFORT')
  console.log('========================================')
  console.log(`  Totalt i source:    ${sourceCandidates.length}`)
  console.log(`  Allerede migrert:   ${existingIds.size}`)
  console.log(`  Nye migrert na:     ${inserted}`)
  console.log(`  Feilet:             ${errors}`)
  console.log('========================================\n')
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════

migrate().catch((err) => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})

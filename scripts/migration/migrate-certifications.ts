/**
 * Migrate Certifications from bluecrew.no to AdminCrew V2
 *
 * IMPORTANT: In bluecrew-v3, certifications are NOT stored in a separate table!
 * They are fields on the candidates table itself:
 *   - stcw_has: TEXT (STCW certificate type)
 *   - stcw_mod: TEXT[] (STCW modules)
 *   - deck_has: TEXT (Deck certificate type)
 *   - deck_class: TEXT (D1, D2, D3, D4, D5, D6)
 *
 * This script reads candidates from bluecrew.no, extracts certification data,
 * and creates certification records in admincrew v2.
 *
 * IMPORTANT: Run migrate-candidates.ts FIRST!
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-certifications.ts [--dry-run] [--limit=N]
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

type CertCategory = 'competency' | 'safety' | 'medical' | 'endorsement' | 'special' | 'other'

interface SourceCandidate {
  id: string
  stcw_has?: string
  stcw_mod?: string[]
  deck_has?: string
  deck_class?: string
}

interface TargetCertification {
  candidate_id: string
  category: CertCategory
  code: string
  name: string
  issuer: string
  issuer_country: string
  is_permanent: boolean
  status: string
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CERTIFICATION MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deck class to full name mapping
 */
const DECK_CLASS_NAMES: Record<string, string> = {
  D1: 'Dekksoffisersertifikat klasse 1 (Skipsforer alle skip)',
  D2: 'Dekksoffisersertifikat klasse 2 (Overstyrmann alle skip)',
  D3: 'Dekksoffisersertifikat klasse 3 (Skipsforer/Overstyrmann begrensede fartsomrader)',
  D4: 'Dekksoffisersertifikat klasse 4 (Styrmann alle skip)',
  D5: 'Dekksoffisersertifikat klasse 5 (Skipsforer fartoy under 500 BT)',
  D6: 'Dekksoffisersertifikat klasse 6 (Skipsforer fartoy under 15m)',
  D5L: 'Dekksoffisersertifikat klasse 5L (Kystskipper)',
}

/**
 * STCW module names
 */
const STCW_MODULE_NAMES: Record<string, string> = {
  'A-VI/1': 'Grunnleggende opplaering i sikkerhet',
  'A-VI/2': 'Redningsfartoy og MOB-bat',
  'A-VI/3': 'Brannslukking for videregaende',
  'A-VI/4': 'Forstehjelpskurs',
  'A-VI/5': 'Sikringsberedskap (SSO)',
  'A-VI/6': 'Sikringsrelatert opplaering',
  'A-II/1': 'Vaktholdssertifikat dekk',
  'A-II/2': 'Overstyrmann/Skipsforer',
  'A-III/1': 'Vaktholdssertifikat maskin',
  'A-III/2': 'Maskinsjef/1. maskinist',
  BRM: 'Bridge Resource Management',
  ERM: 'Engine Resource Management',
  ECDIS: 'Electronic Chart Display and Information System',
  ARPA: 'Automatic Radar Plotting Aid',
  GOC: 'General Operator Certificate (GMDSS)',
  ROC: 'Restricted Operator Certificate',
  SSO: 'Ship Security Officer',
  PSCRB: 'Proficiency in Survival Craft and Rescue Boats',
  AFF: 'Advanced Fire Fighting',
  MFA: 'Medical First Aid',
  MC: 'Medical Care',
}

/**
 * Extract certifications from a source candidate
 */
function extractCertifications(
  source: SourceCandidate,
  targetCandidateId: string
): TargetCertification[] {
  const certs: TargetCertification[] = []
  const now = new Date().toISOString()

  // 1. Deck certificate (D1-D6)
  if (source.deck_class) {
    const deckClass = source.deck_class.toUpperCase()
    certs.push({
      candidate_id: targetCandidateId,
      category: 'competency',
      code: deckClass,
      name: DECK_CLASS_NAMES[deckClass] || `Dekksertifikat ${deckClass}`,
      issuer: 'Sjofartsdirektoratet',
      issuer_country: 'NO',
      is_permanent: false,
      status: 'active',
      created_at: now,
    })
  }

  // 2. STCW basic certificate
  if (source.stcw_has) {
    certs.push({
      candidate_id: targetCandidateId,
      category: 'safety',
      code: 'STCW',
      name: `STCW Sikkerhetskurs (${source.stcw_has})`,
      issuer: 'Godkjent opplaringssenter',
      issuer_country: 'NO',
      is_permanent: false,
      status: 'active',
      created_at: now,
    })
  }

  // 3. Individual STCW modules
  if (source.stcw_mod && source.stcw_mod.length > 0) {
    for (const mod of source.stcw_mod) {
      const moduleName = STCW_MODULE_NAMES[mod] || mod
      const code = mod.replace(/[^a-zA-Z0-9-]/g, '-').toUpperCase()

      certs.push({
        candidate_id: targetCandidateId,
        category: 'safety',
        code: `STCW-${code}`,
        name: moduleName,
        issuer: 'Godkjent opplaringssenter',
        issuer_country: 'NO',
        is_permanent: false,
        status: 'active',
        created_at: now,
      })
    }
  }

  return certs
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION
// ═══════════════════════════════════════════════════════════════════════════════

async function migrate() {
  console.log('\n========================================')
  console.log('  SERTIFIKAT-MIGRERING: bluecrew.no -> admincrew v2')
  console.log('========================================\n')

  if (DRY_RUN) {
    console.log('>>> DRY RUN MODE <<<\n')
  }

  // Validate
  if (!SOURCE_URL || !SOURCE_KEY || !TARGET_URL || !TARGET_KEY) {
    console.error('ERROR: Mangler environment variables')
    console.error('Sjekk at disse er satt i .env.local:')
    console.error('  - SOURCE_SUPABASE_URL')
    console.error('  - SOURCE_SUPABASE_KEY')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Step 1: Get legacy_id → target_id mapping
  console.log('1. Henter kandidat-mapping fra admincrew v2...')

  const { data: candidates, error: candError } = await targetClient
    .from('candidates')
    .select('id, legacy_id')
    .not('legacy_id', 'is', null)

  if (candError) {
    console.error('ERROR:', candError.message)
    process.exit(1)
  }

  const legacyToNewId = new Map<string, string>()
  candidates?.forEach((c) => {
    if (c.legacy_id) {
      legacyToNewId.set(c.legacy_id, c.id)
    }
  })

  console.log(`  ${legacyToNewId.size} migrerte kandidater funnet`)

  if (legacyToNewId.size === 0) {
    console.log('\nIngen migrerte kandidater. Kjor migrate-candidates.ts forst!')
    return
  }

  // Step 2: Fetch source candidates with certification data
  console.log('\n2. Henter kandidater med sertifikatdata fra bluecrew.no...')

  let query = sourceClient
    .from('candidates')
    .select('id, stcw_has, stcw_mod, deck_has, deck_class')
    .or('stcw_has.not.is.null,stcw_mod.not.is.null,deck_class.not.is.null')

  if (LIMIT) {
    query = query.limit(LIMIT)
  }

  const { data: sourceCandidates, error: sourceError } = await query

  if (sourceError) {
    console.error('ERROR fetching from source:', sourceError.message)
    process.exit(1)
  }

  if (!sourceCandidates || sourceCandidates.length === 0) {
    console.log('  Ingen kandidater med sertifikatdata funnet.')
    return
  }

  console.log(`  ${sourceCandidates.length} kandidater med sertifikatdata`)

  // Step 3: Check existing certifications
  console.log('\n3. Sjekker eksisterende sertifikater i target...')

  const { data: existingCerts, error: existError } = await targetClient
    .from('candidate_certifications')
    .select('candidate_id, code')

  if (existError) {
    console.error('ERROR:', existError.message)
    process.exit(1)
  }

  const existingSet = new Set(
    (existingCerts || []).map((c) => `${c.candidate_id}:${c.code}`)
  )

  console.log(`  ${existingSet.size} sertifikater allerede i target`)

  // Step 4: Extract and transform certifications
  console.log('\n4. Ekstraherer sertifikater fra kandidater...')

  const allCerts: TargetCertification[] = []
  let skippedNoMapping = 0
  let skippedExists = 0

  for (const source of sourceCandidates) {
    const targetCandidateId = legacyToNewId.get(source.id)

    if (!targetCandidateId) {
      skippedNoMapping++
      continue
    }

    const certs = extractCertifications(source, targetCandidateId)

    for (const cert of certs) {
      const key = `${cert.candidate_id}:${cert.code}`

      if (existingSet.has(key)) {
        skippedExists++
        continue
      }

      allCerts.push(cert)
      existingSet.add(key) // Prevent duplicates in same batch
    }
  }

  console.log(`  ${allCerts.length} nye sertifikater a migrere`)
  console.log(`  ${skippedNoMapping} kandidater ikke funnet i target`)
  console.log(`  ${skippedExists} sertifikater eksisterer allerede`)

  if (allCerts.length === 0) {
    console.log('\nIngen nye sertifikater a migrere.')
    return
  }

  // Step 5: Preview or insert
  if (DRY_RUN) {
    console.log('\n5. DRY RUN - Forhandsvisning:')

    // Group by category
    const byCategory = allCerts.reduce(
      (acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log('\n  Fordeling per kategori:')
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`    ${cat}: ${count}`)
    })

    // Group by code
    const byCode = allCerts.reduce(
      (acc, c) => {
        acc[c.code] = (acc[c.code] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log('\n  Fordeling per kode (topp 10):')
    Object.entries(byCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([code, count]) => {
        console.log(`    ${code}: ${count}`)
      })

    console.log('\n  Eksempel-sertifikater:')
    allCerts.slice(0, 5).forEach((c, i) => {
      console.log(`    [${i + 1}] ${c.code} - ${c.name.substring(0, 50)}...`)
    })

    console.log('\n>>> Kjor uten --dry-run for a utfore migreringen <<<')
    return
  }

  console.log('\n5. Migrerer sertifikater...')

  const BATCH_SIZE = 100
  let inserted = 0
  let errors = 0

  for (let i = 0; i < allCerts.length; i += BATCH_SIZE) {
    const batch = allCerts.slice(i, i + BATCH_SIZE)

    const { data: insertedBatch, error: insertError } = await targetClient
      .from('candidate_certifications')
      .insert(batch)
      .select('id')

    if (insertError) {
      console.error(`  ERROR batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError.message)
      errors += batch.length
    } else {
      inserted += insertedBatch?.length || 0
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertedBatch?.length || 0} sertifikater`)
    }
  }

  // Summary
  console.log('\n========================================')
  console.log('  MIGRERING FULLFORT')
  console.log('========================================')
  console.log(`  Kandidater med sertifikater: ${sourceCandidates.length}`)
  console.log(`  Nye sertifikater migrert:    ${inserted}`)
  console.log(`  Feilet:                      ${errors}`)
  console.log('========================================\n')
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════

migrate().catch((err) => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})

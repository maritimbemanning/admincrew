// scripts/migration/test-migration.ts
// TEST MIGRATION: Migrer KUN 10 kandidater først
// Dette er SAFE MODE - vi tester alt før vi går videre

import { createClient } from '@supabase/supabase-js'

// Source (bluecrew.no) - READ ONLY
const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!

// Target (admincrew.no) - WRITE
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY)
const targetClient = createClient(TARGET_URL, TARGET_KEY)

interface MigrationResult {
  success: boolean
  processed: number
  created: number
  errors: string[]
  candidates: any[]
}

async function testMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    processed: 0,
    created: 0,
    errors: [],
    candidates: []
  }

  console.log('🧪 TEST MIGRATION - 10 kandidater')
  console.log('=====================================\n')

  try {
    // 1. Hent 10 kandidater fra bluecrew
    console.log('📥 Henter 10 kandidater fra bluecrew.no...')
    const { data: sourceCandidates, error: fetchError } = await sourceClient
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`)
    }

    if (!sourceCandidates || sourceCandidates.length === 0) {
      throw new Error('Ingen kandidater funnet i bluecrew')
    }

    console.log(`✅ Hentet ${sourceCandidates.length} kandidater\n`)

    // 2. Analyser data før mapping
    console.log('🔍 Analyserer data...')
    for (const candidate of sourceCandidates) {
      console.log(`  - ${candidate.first_name || candidate.fornavn} ${candidate.last_name || candidate.etternavn}`)
      console.log(`    Email: ${candidate.email || 'MANGLER'}`)
      console.log(`    Rolle: ${candidate.primary_role || candidate.rolle || 'MANGLER'}`)
      console.log(`    ID: ${candidate.id}`)
    }
    console.log('')

    // 3. Mapper og insert hver kandidat
    console.log('🔄 Mapper og inserter kandidater...\n')
    for (const sourceCandidate of sourceCandidates) {
      try {
        result.processed++

        // Mapper felter
        const mappedCandidate = mapCandidateFields(sourceCandidate)

        // Valider påkrevde felt
        if (!mappedCandidate.email) {
          result.errors.push(`Kandidat ${sourceCandidate.id} mangler email`)
          continue
        }

        // Sjekk om kandidat allerede eksisterer
        const { data: existing } = await targetClient
          .from('candidates')
          .select('id')
          .eq('bluecrew_id', sourceCandidate.id)
          .single()

        if (existing) {
          console.log(`  ⏭️  Kandidat ${mappedCandidate.first_name} ${mappedCandidate.last_name} eksisterer allerede`)
          continue
        }

        // Insert i admincrew
        const { data: newCandidate, error: insertError } = await targetClient
          .from('candidates')
          .insert({
            ...mappedCandidate,
            bluecrew_id: sourceCandidate.id,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
            compliance_status: 'not_started',
            status: 'active'
          })
          .select()
          .single()

        if (insertError) {
          result.errors.push(`Insert feil for ${sourceCandidate.id}: ${insertError.message}`)
          console.log(`  ❌ FEIL: ${insertError.message}`)
          continue
        }

        result.created++
        result.candidates.push(newCandidate)
        console.log(`  ✅ ${mappedCandidate.first_name} ${mappedCandidate.last_name} opprettet`)

      } catch (err: any) {
        result.errors.push(`Processing error for ${sourceCandidate.id}: ${err.message}`)
        console.log(`  ❌ ${err.message}`)
      }
    }

    result.success = result.created > 0

    // 4. Resultat
    console.log('\n=====================================')
    console.log('📊 RESULTAT:')
    console.log(`  Prosessert: ${result.processed}`)
    console.log(`  Opprettet: ${result.created}`)
    console.log(`  Feil: ${result.errors.length}`)
    
    if (result.errors.length > 0) {
      console.log('\n❌ FEIL:')
      result.errors.forEach(err => console.log(`  - ${err}`))
    }

    return result

  } catch (error: any) {
    console.error('💥 KRITISK FEIL:', error.message)
    result.errors.push(error.message)
    return result
  }
}

function mapCandidateFields(source: any) {
  return {
    // Navn
    first_name: source.first_name || source.fornavn || null,
    last_name: source.last_name || source.etternavn || null,
    
    // Kontaktinfo
    email: source.email || null,
    phone: source.phone || source.telefon || null,
    
    // Personalia
    date_of_birth: source.date_of_birth || source.fodselsdato || null,
    nationality: source.nationality || source.nasjonalitet || 'Norwegian',
    
    // Adresse
    address_street: source.address?.street || source.adresse?.gate || null,
    address_city: source.address?.city || source.adresse?.by || null,
    address_postal_code: source.address?.postal_code || source.adresse?.postnummer || null,
    address_country: source.address?.country || source.adresse?.land || 'Norway',
    
    // Roller og erfaring
    primary_role: mapRole(source.primary_role || source.rolle),
    secondary_roles: Array.isArray(source.secondary_roles) 
      ? source.secondary_roles.map(mapRole).filter(Boolean)
      : [],
    experience_years: source.experience_years || source.erfaring_ar || 0,
    
    // Tilgjengelighet
    availability_status: mapAvailability(source.availability || source.tilgjengelighet),
    available_from: source.available_from || source.ledig_fra || null,
    preferred_work_schedule: source.preferred_schedule || source.turnus || null,
    
    // Media
    profile_image_url: source.profile_image_url || source.bilde_url || null,
    cv_url: source.cv_url || null,
    bio: source.bio || source.om_meg || null,
  }
}

function mapRole(role: string | null | undefined): string {
  if (!role) return 'deckhand'
  
  const normalized = role.toLowerCase().trim()
  
  const roleMap: Record<string, string> = {
    // Norsk → Engelsk
    'kaptein': 'captain',
    'skipsfører': 'captain',
    'styrmann': 'mate',
    'overstyrmann': 'chief_mate',
    'maskinist': 'engineer',
    'maskinsjef': 'chief_engineer',
    'dekksmann': 'deckhand',
    'lettmatros': 'ordinary_seaman',
    'matros': 'able_seaman',
    'fullmatros': 'able_seaman',
    'kokk': 'cook',
    'steward': 'steward',
    'messeassistent': 'steward',
    'elektriker': 'electrician',
    'elektroingeniør': 'electrician',
  }
  
  return roleMap[normalized] || 'deckhand'
}

function mapAvailability(status: string | null | undefined): string {
  if (!status) return 'inactive'
  
  const normalized = status.toLowerCase().trim()
  
  const statusMap: Record<string, string> = {
    'tilgjengelig': 'available',
    'ledig': 'available',
    'available': 'available',
    'snart_ledig': 'available_soon',
    'snart ledig': 'available_soon',
    'opptatt': 'on_assignment',
    'på oppdrag': 'on_assignment',
    'ikke_tilgjengelig': 'unavailable',
    'ikke tilgjengelig': 'unavailable',
    'inactive': 'inactive',
  }
  
  return statusMap[normalized] || 'inactive'
}

// Kjør test
testMigration()
  .then(result => {
    if (result.success) {
      console.log('\n✅ TEST VELLYKKET!')
      console.log('Du kan nå fortsette med full migrasjon.')
      process.exit(0)
    } else {
      console.log('\n❌ TEST FEILET!')
      console.log('Fiks feilene før du fortsetter.')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('💥 UKJENT FEIL:', err)
    process.exit(1)
  })

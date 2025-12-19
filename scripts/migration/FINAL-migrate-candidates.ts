// scripts/migration/FINAL-migrate-candidates.ts
// ENDELIG MIGRASJON - Alle 331 kandidater fra gammel til ny Supabase
// Med korrekt felt-mapping

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const OLD = createClient(process.env.SOURCE_SUPABASE_URL!, process.env.SOURCE_SUPABASE_KEY!)
const NEW = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function migrate() {
  console.log('🚀 FINAL KANDIDAT-MIGRASJON')
  console.log('=====================================\n')

  // 1. Hent ALLE kandidater fra gammel
  const { data: oldCandidates, error: fetchErr } = await OLD
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: true })

  if (fetchErr || !oldCandidates) {
    console.log('❌ Kunne ikke hente kandidater:', fetchErr?.message)
    return
  }

  console.log(`📊 Fant ${oldCandidates.length} kandidater i gammel DB\n`)

  // 2. Hent eksisterende i ny (for å unngå duplikater)
  const { data: existingNew } = await NEW
    .from('candidates')
    .select('email, legacy_id')

  const existingEmails = new Set((existingNew || []).map(c => c.email?.toLowerCase()))
  const existingLegacyIds = new Set((existingNew || []).map(c => c.legacy_id))

  let created = 0, updated = 0, skipped = 0, errors = 0

  for (const old of oldCandidates) {
    try {
      const mapped = mapCandidate(old)
      
      // Sjekk om finnes allerede
      if (existingLegacyIds.has(old.id)) {
        // Oppdater eksisterende
        const { error } = await NEW
          .from('candidates')
          .update(mapped)
          .eq('legacy_id', old.id)

        if (error) {
          console.log(`❌ Update ${old.email}: ${error.message}`)
          errors++
        } else {
          updated++
        }
      } else if (existingEmails.has(old.email?.toLowerCase())) {
        // Email finnes men ikke legacy_id - oppdater med legacy_id
        const { error } = await NEW
          .from('candidates')
          .update({ ...mapped, legacy_id: old.id, legacy_source: 'bluecrew_v3' })
          .eq('email', old.email)

        if (error) {
          console.log(`❌ Update by email ${old.email}: ${error.message}`)
          errors++
        } else {
          updated++
        }
      } else {
        // Ny kandidat
        const { error } = await NEW
          .from('candidates')
          .insert({
            ...mapped,
            legacy_id: old.id,
            legacy_source: 'bluecrew_v3',
          })

        if (error) {
          console.log(`❌ Insert ${old.email}: ${error.message}`)
          errors++
        } else {
          created++
        }
      }
    } catch (err: any) {
      console.log(`❌ ${old.email}: ${err.message}`)
      errors++
    }
  }

  console.log('\n=====================================')
  console.log('📊 RESULTAT:')
  console.log(`   ✅ Opprettet: ${created}`)
  console.log(`   🔄 Oppdatert: ${updated}`)
  console.log(`   ❌ Feil: ${errors}`)
  console.log('=====================================\n')

  // Verifiser
  const { count } = await NEW.from('candidates').select('*', { count: 'exact', head: true })
  console.log(`📊 Totalt i ny DB: ${count} kandidater`)
}

function mapCandidate(old: any) {
  // Splitt navn hvis nødvendig
  let firstName = old.first_name
  let lastName = old.last_name
  
  if (!firstName && old.name) {
    const parts = (old.name || '').trim().split(' ')
    firstName = parts[0] || 'Ukjent'
    lastName = parts.slice(1).join(' ') || ''
  }
  if (!firstName && old.navn) {
    const parts = (old.navn || '').trim().split(' ')
    firstName = parts[0] || 'Ukjent'
    lastName = parts.slice(1).join(' ') || ''
  }

  return {
    // Personalia
    first_name: firstName || 'Ukjent',
    last_name: lastName || '',
    email: old.email,
    phone: old.phone || old.mobile || null,
    date_of_birth: old.date_of_birth || null,
    nationality: old.nationality || 'NO',
    
    // Lokasjon
    fylke: old.fylke || old.county || null,
    kommune: old.kommune || old.municipality || null,
    address_city: old.city || old.kommune || old.municipality || null,
    address_country: old.country || 'NO',
    
    // Profesjonell
    primary_role: mapRole(old.rolle || old.primary_rank || old.work_main?.[0]),
    secondary_roles: old.secondary_ranks || old.work_main || [],
    experience_years: old.years_of_experience || old.erfaring || 0,
    sectors: old.sectors || old.vessel_types || [],
    
    // Tilgjengelighet
    availability_status: mapAvailability(old),
    availability_date: old.available_from || null,
    
    // Dokumenter
    cv_file_path: old.cv_key || null,
    cv_summary: old.skills || old.other_comp || null,
    
    // Sertifikater som JSON i source_details
    source_details: {
      stcw_has: old.stcw_has,
      stcw_mod: old.stcw_mod,
      deck_has: old.deck_has,
      deck_class: old.deck_class,
      wants_temporary: old.wants_temporary,
      certs_key: old.certs_key,
      original_status: old.status,
      verification_status: old.verification_status,
      gdpr_consent: old.gdpr_consent,
    },
    
    // Compliance
    compliance_status: mapCompliance(old.status, old.verification_status),
    
    // Metadata
    source: 'bluecrew_website',
    tags: old.departments || old.positions || [],
    internal_notes: old.internal_notes || null,
    
    // Timestamps
    created_at: old.created_at,
    updated_at: old.updated_at || old.created_at,
  }
}

function mapRole(role: any): string {
  if (!role) return 'deckhand'
  if (Array.isArray(role)) role = role[0]
  if (typeof role !== 'string') return 'deckhand'
  
  const r = role.toLowerCase().trim()
  const map: Record<string, string> = {
    'kaptein': 'captain',
    'skipsfører': 'captain', 
    'skipper': 'captain',
    'styrmann': 'mate',
    'overstyrmann': 'chief_mate',
    '1. styrmann': 'chief_mate',
    '2. styrmann': 'second_mate',
    'maskinist': 'engineer',
    'maskinsjef': 'chief_engineer',
    '1. maskinist': 'chief_engineer',
    '2. maskinist': 'second_engineer',
    'dekksmann': 'deckhand',
    'matros': 'able_seaman',
    'lettmatros': 'ordinary_seaman',
    'kokk': 'cook',
    'steward': 'steward',
    'elektriker': 'electrician',
    'dekk': 'deckhand',
    'maskin': 'engineer',
    'catering': 'cook',
  }
  return map[r] || 'deckhand'
}

function mapAvailability(old: any): string {
  // Sjekk tilgjengelighet-felt
  if (old.tilgjengelighet) {
    const t = old.tilgjengelighet.toLowerCase()
    if (t.includes('tilgjengelig') || t.includes('ledig')) return 'available'
    if (t.includes('snart')) return 'available_soon'
    if (t.includes('opptatt') || t.includes('oppdrag')) return 'on_assignment'
  }
  
  // Sjekk available_from dato
  if (old.available_from) {
    const d = new Date(old.available_from)
    const now = new Date()
    if (d <= now) return 'available'
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    if (d <= twoWeeks) return 'available_soon'
    return 'unavailable'
  }
  
  // Sjekk status
  if (old.status === 'aktiv' || old.is_active) return 'available'
  if (old.status === 'inaktiv' || old.archived_at) return 'inactive'
  
  return 'inactive'
}

function mapCompliance(status: string | null, verificationStatus: string | null): string {
  if (verificationStatus === 'verified') return 'approved'
  if (status === 'godkjent') return 'approved'
  if (status === 'pending') return 'review_pending'
  return 'not_started'
}

// KJØR
migrate()
  .then(() => {
    console.log('✅ FERDIG!')
    process.exit(0)
  })
  .catch(err => {
    console.error('💥 KRITISK FEIL:', err)
    process.exit(1)
  })

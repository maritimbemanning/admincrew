import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/webhooks/bluecrew
 * 
 * Webhook for å motta oppdateringer fra bluecrew.no
 * Brukes for kandidat-synkronisering via Supabase pg_net trigger
 */
export async function POST(request: NextRequest) {
  try {
    // Sjekk at request kommer fra forventet kilde
    const source = request.headers.get('x-webhook-source')
    const timestamp = request.headers.get('x-webhook-timestamp')
    
    console.log(`[WEBHOOK] Received from: ${source}, timestamp: ${timestamp}`)

    // Parse body
    const payload = await request.json()
    const { event, data } = payload

    console.log(`[WEBHOOK] Event: ${event}`)
    console.log(`[WEBHOOK] Data:`, JSON.stringify(data, null, 2))

    // Bruk admin client for å unngå RLS
    const supabase = createAdminClient()

    switch (event) {
      case 'candidate.created':
        await handleCandidateCreate(supabase, data)
        break
        
      case 'candidate.updated':
        await handleCandidateUpdate(supabase, data)
        break

      case 'candidate.deleted':
        await handleCandidateDelete(supabase, data)
        break

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event}`)
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('[WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: String(error) },
      { status: 500 }
    )
  }
}

async function handleCandidateCreate(supabase: any, data: any) {
  const { bluecrew_id, certifications, source_details, ...candidateData } = data

  // Sjekk om kandidat allerede finnes (duplikat-beskyttelse)
  const { data: existing } = await supabase
    .from('candidates')
    .select('id')
    .eq('legacy_id', bluecrew_id)
    .single()

  if (existing) {
    console.log(`[WEBHOOK] Kandidat ${bluecrew_id} eksisterer allerede, oppdaterer...`)
    return handleCandidateUpdate(supabase, data)
  }

  // Opprett ny kandidat
  const { data: newCandidate, error } = await supabase
    .from('candidates')
    .insert({
      ...candidateData,
      legacy_id: bluecrew_id,
      legacy_source: 'bluecrew_v3',
      compliance_status: 'not_started',
      status: 'active',
      source: 'bluecrew_website',
      source_details: source_details || {},
    })
    .select()
    .single()

  if (error) {
    console.error(`[WEBHOOK] Insert error:`, error)
    throw error
  }

  console.log(`[WEBHOOK] Created candidate: ${newCandidate.id}`)

  // Opprett sertifikater hvis vi har dem
  if (certifications && newCandidate) {
    await syncCertifications(supabase, newCandidate.id, certifications)
  }
}

async function handleCandidateUpdate(supabase: any, data: any) {
  const { bluecrew_id, certifications, source_details, ...candidateData } = data

  const { error } = await supabase
    .from('candidates')
    .update({
      ...candidateData,
      updated_at: new Date().toISOString(),
    })
    .eq('legacy_id', bluecrew_id)

  if (error) {
    console.error(`[WEBHOOK] Update error:`, error)
    throw error
  }

  console.log(`[WEBHOOK] Updated candidate: ${bluecrew_id}`)

  // Oppdater sertifikater
  if (certifications) {
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('legacy_id', bluecrew_id)
      .single()

    if (candidate) {
      await syncCertifications(supabase, candidate.id, certifications)
    }
  }
}

async function handleCandidateDelete(supabase: any, data: any) {
  const { bluecrew_id } = data

  // Soft delete - sett til archived
  const { error } = await supabase
    .from('candidates')
    .update({
      availability_status: 'inactive',
      archived_at: new Date().toISOString(),
      archived_reason: 'Deleted from bluecrew.no',
    })
    .eq('legacy_id', bluecrew_id)

  if (error) {
    console.error(`[WEBHOOK] Delete error:`, error)
    throw error
  }

  console.log(`[WEBHOOK] Soft-deleted candidate: ${bluecrew_id}`)
}

async function syncCertifications(supabase: any, candidateId: string, certs: any) {
  // Map bluecrew sertifikat-format til admincrew
  const certifications = []

  if (certs.stcw_has) {
    certifications.push({
      candidate_id: candidateId,
      name: 'STCW',
      category: 'safety',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false,
      metadata: { modules: certs.stcw_mod }
    })
  }

  if (certs.deck_has) {
    certifications.push({
      candidate_id: candidateId,
      name: `Dekksoffiser ${certs.deck_class || ''}`.trim(),
      category: 'competency',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false,
    })
  }

  if (certs.machine_has) {
    certifications.push({
      candidate_id: candidateId,
      name: `Maskinoffiser ${certs.machine_class || ''}`.trim(),
      category: 'competency',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false,
    })
  }

  if (certs.radio_has) {
    certifications.push({
      candidate_id: candidateId,
      name: `Radiosertifikat ${certs.radio_type || ''}`.trim(),
      category: 'endorsement',
      issuing_authority: 'Nasjonal kommunikasjonsmyndighet',
      is_verified: false,
    })
  }

  // Slett eksisterende og insert nye
  if (certifications.length > 0) {
    // Ikke slett - bare legg til (unngå duplikater via sjekk)
    for (const cert of certifications) {
      const { data: existing } = await supabase
        .from('candidate_certifications')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('name', cert.name)
        .single()

      if (!existing) {
        await supabase.from('candidate_certifications').insert(cert)
        console.log(`[WEBHOOK] Added certification: ${cert.name}`)
      }
    }
  }
}

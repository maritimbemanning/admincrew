// supabase/functions/bridge-sync/index.ts
// Edge Function for synkronisering fra bluecrew.no til admincrew.no

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  mode: 'full' | 'incremental'
  since?: string // ISO date for incremental
  limit?: number
}

interface SyncResult {
  synced: number
  created: number
  updated: number
  skipped: number
  errors: string[]
  duration_ms: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()

    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase clients
    const admincrewUrl = Deno.env.get('SUPABASE_URL')!
    const admincrewServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const bluecrewUrl = Deno.env.get('BLUECREW_SUPABASE_URL')!
    const bluecrewKey = Deno.env.get('BLUECREW_SUPABASE_ANON_KEY')!

    const admincrew = createClient(admincrewUrl, admincrewServiceKey)
    const bluecrew = createClient(bluecrewUrl, bluecrewKey)

    // Parse request
    const body: SyncRequest = await req.json()
    const { mode = 'incremental', since, limit = 100 } = body

    const result: SyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      duration_ms: 0,
    }

    // Build query for bluecrew candidates
    let query = bluecrew
      .from('candidates')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

    // For incremental sync, only get records updated since last sync
    if (mode === 'incremental' && since) {
      query = query.gte('updated_at', since)
    }

    const { data: bluecrewCandidates, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch from bluecrew: ${fetchError.message}`)
    }

    if (!bluecrewCandidates || bluecrewCandidates.length === 0) {
      result.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ ...result, message: 'No candidates to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each candidate
    for (const bcCandidate of bluecrewCandidates) {
      try {
        // Map bluecrew fields to admincrew schema
        const mappedCandidate = mapCandidateFields(bcCandidate)

        // Check if candidate exists (use legacy_id for matching)
        const { data: existing } = await admincrew
          .from('candidates')
          .select('id, updated_at')
          .eq('legacy_id', bcCandidate.id)
          .single()

        let candidateId: string | null = null

        if (existing) {
          // Update existing
          const { error: updateError } = await admincrew
            .from('candidates')
            .update({
              ...mappedCandidate,
              updated_at: new Date().toISOString(),
            })
            .eq('legacy_id', bcCandidate.id)

          if (updateError) {
            result.errors.push(`Update failed for ${bcCandidate.id}: ${updateError.message}`)
          } else {
            candidateId = existing.id
            result.updated++
          }
        } else {
          // Create new
          const { data: newCandidate, error: insertError } = await admincrew
            .from('candidates')
            .insert({
              ...mappedCandidate,
              legacy_id: bcCandidate.id,
              legacy_source: 'bluecrew_v3',
              compliance_status: 'not_started',
            })
            .select('id')
            .single()

          if (insertError) {
            result.errors.push(`Insert failed for ${bcCandidate.id}: ${insertError.message}`)
          } else {
            candidateId = newCandidate?.id
            result.created++
          }
        }

        // Sync certifications if candidate was created/updated
        if (candidateId) {
          await syncCertifications(admincrew, candidateId, bcCandidate)
        }

        result.synced++
      } catch (err) {
        result.errors.push(`Processing failed for ${bcCandidate.id}: ${err.message}`)
        result.skipped++
      }
    }

    result.duration_ms = Date.now() - startTime

    // Log sync operation
    await admincrew.from('activity_log').insert({
      entity_type: 'system',
      entity_id: crypto.randomUUID(),
      action: 'bridge_sync',
      metadata: {
        mode,
        ...result,
      },
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Bridge sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function mapCandidateFields(bcCandidate: any) {
  // Map bluecrew.no fields to admincrew.no schema
  // Bluecrew uses: name (full), cv_key, work_main[], etc.

  // Split name into first/last
  const nameParts = (bcCandidate.name || '').trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  // Get primary role from work_main array
  const workMain = bcCandidate.work_main || []
  const primaryRole = workMain.length > 0 ? mapRole(workMain[0]) : null
  const secondaryRoles = workMain.slice(1).map(mapRole).filter(Boolean)

  return {
    // Basic info
    first_name: firstName,
    last_name: lastName,
    name: bcCandidate.name,
    email: bcCandidate.email,
    phone: bcCandidate.phone,

    // Location
    address_city: bcCandidate.kommune || bcCandidate.municipality || bcCandidate.county,

    // Roles
    primary_role: primaryRole,
    secondary_roles: secondaryRoles,

    // Availability
    availability_status: mapAvailability(bcCandidate.status),
    availability_date: bcCandidate.available_from,

    // CV - the key field!
    cv_file_path: bcCandidate.cv_key,
    cv_key: bcCandidate.cv_key,

    // GDPR
    gdpr_consent: bcCandidate.gdpr_consent,

    // Status
    status: bcCandidate.status || 'active',
  }
}

function mapRole(role: string | null): string | null {
  if (!role) return null

  const roleMap: Record<string, string> = {
    // Norwegian to system codes
    'kaptein': 'captain',
    'skipper': 'skipper',
    'overstyrmann': 'chief_officer',
    'styrmann': 'second_officer',
    '1. styrmann': 'second_officer',
    '2. styrmann': 'third_officer',
    'maskinsjef': 'chief_engineer',
    'maskinist': 'engineer',
    '1. maskinist': 'second_engineer',
    '2. maskinist': 'third_engineer',
    'eto': 'electro_technical_officer',
    'matros': 'able_seaman',
    'dekksmann': 'ordinary_seaman',
    'dekksarbeider': 'ordinary_seaman',
    'lettmatros': 'ordinary_seaman',
    'motormann': 'motorman',
    'kokk': 'cook',
    'steward': 'steward',
    'forpleining': 'steward',
    'rov-pilot': 'rov_pilot',
    'rov pilot': 'rov_pilot',
    'dp-operatør': 'dp_operator',
    'dp operatør': 'dp_operator',
    'dykker': 'diver',
    'akvatekniker': 'aquaculture_technician',
    'servicebåt oppdrett': 'aquaculture_technician',
    // English variants
    'captain': 'captain',
    'mate': 'second_officer',
    'chief officer': 'chief_officer',
    'engineer': 'engineer',
    'deckhand': 'ordinary_seaman',
    'catering_assistant': 'steward',
    'deck_officer': 'second_officer',
    'rov_operator': 'rov_pilot',
    'fisherman': 'other_maritime',
    // Fallbacks
    'annet': 'other',
    'annet maritimt': 'other_maritime',
  }

  return roleMap[role.toLowerCase()] || role.toLowerCase().replace(/\s+/g, '_')
}

function mapAvailability(status: string | null): string {
  if (!status) return 'available'

  const statusMap: Record<string, string> = {
    'tilgjengelig': 'available',
    'ledig': 'available',
    'active': 'available',
    'snart_ledig': 'available_soon',
    'opptatt': 'on_assignment',
    'ikke_tilgjengelig': 'unavailable',
    'archived': 'inactive',
  }

  return statusMap[status.toLowerCase()] || 'available'
}

async function syncCertifications(supabase: any, candidateId: string, bcCandidate: any) {
  const certifications = []

  // STCW
  if (bcCandidate.stcw_has === 'yes' || bcCandidate.stcw_confirmed) {
    certifications.push({
      candidate_id: candidateId,
      name: 'STCW',
      category: 'safety',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false,
      metadata: { modules: bcCandidate.stcw_mod || [] }
    })
  }

  // Deck certificate
  if (bcCandidate.deck_has === 'yes') {
    certifications.push({
      candidate_id: candidateId,
      name: `Dekksoffiser ${bcCandidate.deck_class || ''}`.trim(),
      category: 'competency',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false,
    })
  }

  // Insert certs (avoid duplicates)
  for (const cert of certifications) {
    const { data: existing } = await supabase
      .from('candidate_certifications')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('name', cert.name)
      .single()

    if (!existing) {
      await supabase.from('candidate_certifications').insert(cert)
    }
  }
}

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

        // Check if candidate exists
        const { data: existing } = await admincrew
          .from('candidates')
          .select('id, updated_at')
          .eq('bluecrew_id', bcCandidate.id)
          .single()

        if (existing) {
          // Update existing
          const { error: updateError } = await admincrew
            .from('candidates')
            .update({
              ...mappedCandidate,
              updated_at: new Date().toISOString(),
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            })
            .eq('bluecrew_id', bcCandidate.id)

          if (updateError) {
            result.errors.push(`Update failed for ${bcCandidate.id}: ${updateError.message}`)
          } else {
            result.updated++
          }
        } else {
          // Create new
          const { error: insertError } = await admincrew
            .from('candidates')
            .insert({
              ...mappedCandidate,
              bluecrew_id: bcCandidate.id,
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
              compliance_status: 'not_started',
            })

          if (insertError) {
            result.errors.push(`Insert failed for ${bcCandidate.id}: ${insertError.message}`)
          } else {
            result.created++
          }
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
  return {
    first_name: bcCandidate.first_name || bcCandidate.fornavn,
    last_name: bcCandidate.last_name || bcCandidate.etternavn,
    email: bcCandidate.email,
    phone: bcCandidate.phone || bcCandidate.telefon,
    date_of_birth: bcCandidate.date_of_birth || bcCandidate.fodselsdato,
    address_street: bcCandidate.address?.street,
    address_city: bcCandidate.address?.city,
    address_postal_code: bcCandidate.address?.postal_code,
    nationality: bcCandidate.nationality,
    primary_role: mapRole(bcCandidate.primary_role || bcCandidate.rolle),
    secondary_roles: bcCandidate.secondary_roles || [],
    experience_years: bcCandidate.experience_years || bcCandidate.erfaring_ar,
    availability_status: mapAvailability(bcCandidate.availability || bcCandidate.tilgjengelighet),
    available_from: bcCandidate.available_from || bcCandidate.ledig_fra,
    preferred_work_schedule: bcCandidate.preferred_schedule || bcCandidate.turnus,
    profile_image_url: bcCandidate.profile_image_url || bcCandidate.bilde_url,
    cv_url: bcCandidate.cv_url,
    bio: bcCandidate.bio || bcCandidate.om_meg,
  }
}

function mapRole(role: string | null): string | null {
  if (!role) return null
  
  const roleMap: Record<string, string> = {
    'kaptein': 'captain',
    'styrmann': 'mate',
    'maskinist': 'engineer',
    'dekksmann': 'deckhand',
    'matros': 'able_seaman',
    'kokk': 'cook',
    // Add more mappings as needed
  }
  
  return roleMap[role.toLowerCase()] || role.toLowerCase()
}

function mapAvailability(status: string | null): string {
  if (!status) return 'inactive'
  
  const statusMap: Record<string, string> = {
    'tilgjengelig': 'available',
    'ledig': 'available',
    'snart_ledig': 'available_soon',
    'opptatt': 'on_assignment',
    'ikke_tilgjengelig': 'unavailable',
  }
  
  return statusMap[status.toLowerCase()] || 'inactive'
}

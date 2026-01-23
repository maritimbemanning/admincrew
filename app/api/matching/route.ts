import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runMatching } from '@/lib/matching/engine'
import type { MatchingCriteria } from '@/types/operations'

/**
 * POST /api/matching
 * 
 * 10-sekunds matching endpoint
 * Tar imot søkekriterier og returnerer rangert kandidatliste
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now()

  try {
    const supabase = await createClient()

    // Sjekk autentisering
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ikke autentisert' },
        { status: 401 }
      )
    }

    // Hent request body
    const body = await request.json()
    const criteria: MatchingCriteria = body.criteria
    const options = body.options || {}

    // Valider påkrevde felt
    if (!criteria?.role) {
      return NextResponse.json(
        { error: 'Rolle er påkrevd' },
        { status: 400 }
      )
    }

    if (!criteria?.start_date) {
      return NextResponse.json(
        { error: 'Startdato er påkrevd' },
        { status: 400 }
      )
    }

    // Kjør matching
    const result = await runMatching(criteria, options)

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    // Logg matching for analytics
    await supabase.from('activity_log').insert({
      entity_type: 'matching',
      entity_id: crypto.randomUUID(),
      action: 'search',
      user_id: user.id,
      metadata: {
        criteria: {
          role: criteria.role,
          certifications_required: criteria.certifications?.required?.length || 0,
        },
        results_count: result.results.length,
        duration_ms: duration,
      },
    })

    return NextResponse.json({
      ...result,
      meta: {
        duration_ms: duration,
        within_target: duration < 10000, // Under 10 sekunder
      },
    })
  } catch (error) {
    console.error('Matching error:', error)
    return NextResponse.json(
      { error: 'Intern serverfeil ved matching' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/matching
 * 
 * Henter tidligere matching-resultater eller foreslåtte kandidater
 * for en spesifikk request
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sjekk autentisering
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ikke autentisert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id parameter er påkrevd' },
        { status: 400 }
      )
    }

    // Hent shortlist for request
    const { data: shortlist, error: shortlistError } = await supabase
      .from('request_shortlists')
      .select(`
        *,
        candidate:candidates(
          id,
          first_name,
          last_name,
          email,
          phone,
          availability_status,
          compliance_status,
          internal_rating,
          profile_image_url
        )
      `)
      .eq('request_id', requestId)
      .order('rank_order', { ascending: true })

    if (shortlistError) {
      throw shortlistError
    }

    return NextResponse.json({
      request_id: requestId,
      shortlist: shortlist || [],
      count: shortlist?.length || 0,
    })
  } catch (error) {
    console.error('Get matching error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente matching-resultater' },
      { status: 500 }
    )
  }
}

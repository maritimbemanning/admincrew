import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/candidates
 * Henter profiler fra bluecrew_profiles med filtrering og paginering
 *
 * bluecrew_profiles is the source of truth for all candidate data.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - require authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Paginering
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Filtre
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const poolId = searchParams.get('pool_id')

    // Query bluecrew_profiles as source of truth
    let query = supabase
      .from('bluecrew_profiles')
      .select('*', { count: 'exact' })
      .is('archived_at', null)

    // Søk
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,short_id.ilike.%${search}%`)
    }

    // Status filter
    if (status) {
      query = query.eq('availability_status', status)
    }

    // Pool filter - bruk candidate_pool_memberships via candidate_id
    if (poolId) {
      const { data: memberIds } = await supabase
        .from('candidate_pool_memberships')
        .select('candidate_id')
        .eq('pool_id', poolId)

      if (memberIds && memberIds.length > 0) {
        const candidateIds = memberIds.map(m => m.candidate_id)
        query = query.in('candidate_id', candidateIds)
      } else {
        // No members in pool, return empty
        return NextResponse.json({
          data: [],
          meta: { page, limit, total: 0, total_pages: 0 },
        })
      }
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data: data || [],
      meta: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get candidates error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente kandidater' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/candidates
 * Oppretter ny profil i bluecrew_profiles
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - require authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await request.json()

    // Valider påkrevde felt
    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        { error: 'Fornavn, etternavn og e-post er påkrevd' },
        { status: 400 }
      )
    }

    // Map fields to bluecrew_profiles schema
    const profileData: Record<string, unknown> = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      primary_role: body.primary_role,
      secondary_roles: body.secondary_roles,
      experience_years: body.experience_years,
      availability_status: body.availability_status || 'available',
      availability_date: body.availability_date,
      sectors: body.sectors,
      internal_notes: body.internal_notes,
      tags: body.tags,
      cv_summary: body.cv_summary,
      birth_date: body.date_of_birth || body.birth_date,
      nationality: body.nationality,
      city: body.address_city || body.city,
      country: body.address_country || body.country,
    }

    // Remove undefined values
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === undefined) delete profileData[key]
    })

    const { data, error } = await supabase
      .from('bluecrew_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create candidate error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette kandidat' },
      { status: 500 }
    )
  }
}

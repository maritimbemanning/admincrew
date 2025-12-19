import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/candidates
 * Henter kandidater med filtrering og paginering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sjekk autentisering
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
    const compliance = searchParams.get('compliance')
    const poolId = searchParams.get('pool_id')

    let query = supabase
      .from('candidates')
      .select('*', { count: 'exact' })

    // Søk
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Status filter
    if (status) {
      query = query.eq('availability_status', status)
    }

    // Compliance filter
    if (compliance) {
      query = query.eq('compliance_status', compliance)
    }

    // Pool filter - bruk pool_members relation
    if (poolId) {
      const { data: memberIds } = await supabase
        .from('pool_members')
        .select('candidate_id')
        .eq('pool_id', poolId)
      
      if (memberIds) {
        query = query.in('id', memberIds.map(m => m.candidate_id))
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
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
 * Oppretter ny kandidat
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        ...body,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Logg aktivitet
    await supabase.from('activity_log').insert({
      entity_type: 'candidate',
      entity_id: data.id,
      action: 'created',
      user_id: user.id,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create candidate error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette kandidat' },
      { status: 500 }
    )
  }
}

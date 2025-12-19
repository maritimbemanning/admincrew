import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/crm/organizations
 * Henter organisasjoner med filtrering og paginering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const search = searchParams.get('search')
    const stage = searchParams.get('stage')

    let query = supabase
      .from('crm_organizations')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,org_number.ilike.%${search}%`)
    }

    if (stage) {
      query = query.eq('pipeline_stage', stage)
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
    console.error('Get organizations error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente organisasjoner' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/crm/organizations
 * Oppretter ny organisasjon
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Organisasjonsnavn er påkrevd' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('crm_organizations')
      .insert({
        ...body,
        owner_id: user.id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_log').insert({
      entity_type: 'organization',
      entity_id: data.id,
      action: 'created',
      user_id: user.id,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create organization error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette organisasjon' },
      { status: 500 }
    )
  }
}

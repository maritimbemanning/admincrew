import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/operations/requests
 * Henter customer requests med filtrering
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
    const status = searchParams.get('status')
    const organizationId = searchParams.get('organization_id')

    let query = supabase
      .from('customer_requests')
      .select(`
        *,
        organization:crm_organizations(id, name),
        contact:crm_contacts(id, first_name, last_name)
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
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
    console.error('Get requests error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente forespørsler' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/operations/requests
 * Oppretter ny forespørsel
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.organization_id || !body.role_needed || !body.start_date) {
      return NextResponse.json(
        { error: 'Organisasjon, rolle og startdato er påkrevd' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('customer_requests')
      .insert({
        ...body,
        created_by: user.id,
        status: body.status || 'draft',
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_log').insert({
      entity_type: 'request',
      entity_id: data.id,
      action: 'created',
      user_id: user.id,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create request error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette forespørsel' },
      { status: 500 }
    )
  }
}

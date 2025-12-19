import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/crm/contacts
 * Henter kontakter med filtrering og paginering
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
    const organizationId = searchParams.get('organization_id')

    let query = supabase
      .from('crm_contacts')
      .select(`
        *,
        organization:crm_organizations(id, name)
      `, { count: 'exact' })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
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
    console.error('Get contacts error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente kontakter' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/crm/contacts
 * Oppretter ny kontakt
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        { error: 'Fornavn, etternavn og e-post er påkrevd' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert({
        ...body,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_log').insert({
      entity_type: 'contact',
      entity_id: data.id,
      action: 'created',
      user_id: user.id,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette kontakt' },
      { status: 500 }
    )
  }
}

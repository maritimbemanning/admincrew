import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/contracts
 * Henter kontrakter med filtrering
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
    const type = searchParams.get('type')

    let query = supabase
      .from('contracts')
      .select(`
        *,
        parties:contract_parties(*)
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
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
    console.error('Get contracts error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente kontrakter' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts
 * Oppretter ny kontrakt
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: 'Tittel og type er påkrevd' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        ...body,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    // Opprett parter hvis de er inkludert
    if (body.parties && Array.isArray(body.parties)) {
      for (const party of body.parties) {
        await supabase.from('contract_parties').insert({
          contract_id: data.id,
          ...party,
        })
      }
    }

    await supabase.from('activity_log').insert({
      entity_type: 'contract',
      entity_id: data.id,
      action: 'created',
      user_id: user.id,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create contract error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke opprette kontrakt' },
      { status: 500 }
    )
  }
}

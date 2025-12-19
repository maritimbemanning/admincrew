import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/candidates/[id]
 * Henter en spesifikk kandidat med alle relasjoner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        certifications:candidate_certifications(*),
        documents:candidate_documents(*),
        pools:pool_members(
          pool:candidate_pools(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Kandidat ikke funnet' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get candidate error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente kandidat' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/candidates/[id]
 * Oppdaterer en kandidat
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await request.json()

    // Fjern felt som ikke skal oppdateres direkte
    delete body.id
    delete body.created_at
    delete body.created_by

    const { data, error } = await supabase
      .from('candidates')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Logg aktivitet
    await supabase.from('activity_log').insert({
      entity_type: 'candidate',
      entity_id: id,
      action: 'updated',
      user_id: user.id,
      metadata: { updated_fields: Object.keys(body) },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Update candidate error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere kandidat' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/candidates/[id]
 * Sletter en kandidat (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    // Soft delete ved å sette availability_status til inactive
    const { error } = await supabase
      .from('candidates')
      .update({
        availability_status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    // Logg aktivitet
    await supabase.from('activity_log').insert({
      entity_type: 'candidate',
      entity_id: id,
      action: 'deleted',
      user_id: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete candidate error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke slette kandidat' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/candidates/[id]
 * Henter en spesifikk profil fra bluecrew_profiles med relasjoner
 *
 * @param id - The bluecrew_profiles.id (profile ID)
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

    // Fetch profile from bluecrew_profiles
    const { data: profile, error } = await supabase
      .from('bluecrew_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Kandidat ikke funnet' }, { status: 404 })
      }
      throw error
    }

    // Get candidate_id for relationship queries
    const candidateId = profile.candidate_id as string | null

    // Fetch related data via candidate_id
    let certifications: unknown[] = []
    let documents: unknown[] = []
    let pools: unknown[] = []

    if (candidateId) {
      // Certifications
      const { data: certs } = await supabase
        .from('candidate_certifications')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('status', 'active')

      certifications = certs || []

      // Documents
      const { data: docs } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('candidate_id', candidateId)
        .is('archived_at', null)

      documents = docs || []

      // Pool memberships
      const { data: poolMemberships } = await supabase
        .from('candidate_pool_memberships')
        .select('pool:candidate_pools(*)')
        .eq('candidate_id', candidateId)

      pools = (poolMemberships || [])
        .map(pm => pm.pool)
        .filter(Boolean)
    }

    return NextResponse.json({
      data: {
        ...profile,
        certifications,
        documents,
        pools,
      }
    })
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
 * Oppdaterer en profil i bluecrew_profiles
 *
 * @param id - The bluecrew_profiles.id (profile ID)
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
    delete body.candidate_id // Don't allow changing the link

    // Map to bluecrew_profiles columns
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Personal info
    if (body.first_name !== undefined) updateData.first_name = body.first_name
    if (body.last_name !== undefined) updateData.last_name = body.last_name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.birth_date !== undefined) updateData.birth_date = body.birth_date
    if (body.nationality !== undefined) updateData.nationality = body.nationality

    // Location
    if (body.city !== undefined) updateData.city = body.city
    if (body.country !== undefined) updateData.country = body.country

    // Professional info
    if (body.primary_role !== undefined) updateData.primary_role = body.primary_role
    if (body.secondary_roles !== undefined) updateData.secondary_roles = body.secondary_roles
    if (body.experience_years !== undefined) updateData.experience_years = body.experience_years
    if (body.sectors !== undefined) updateData.sectors = body.sectors
    if (body.cv_summary !== undefined) updateData.cv_summary = body.cv_summary
    if (body.languages !== undefined) updateData.languages = body.languages

    // Availability
    if (body.availability_status !== undefined) updateData.availability_status = body.availability_status
    if (body.availability_date !== undefined) updateData.availability_date = body.availability_date

    // Internal
    if (body.internal_rating !== undefined) updateData.internal_rating = body.internal_rating
    if (body.internal_notes !== undefined) updateData.internal_notes = body.internal_notes
    if (body.tags !== undefined) updateData.tags = body.tags

    const { data, error } = await supabase
      .from('bluecrew_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Logg aktivitet
    await supabase.from('activity_log').insert({
      entity_type: 'bluecrew_profile',
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
 * Arkiverer en profil i bluecrew_profiles (soft delete)
 *
 * @param id - The bluecrew_profiles.id (profile ID)
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

    // Soft delete by setting archived_at
    const { error } = await supabase
      .from('bluecrew_profiles')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    // Logg aktivitet
    await supabase.from('activity_log').insert({
      entity_type: 'bluecrew_profile',
      entity_id: id,
      action: 'archived',
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

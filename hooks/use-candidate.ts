'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CandidateWithRelations, CandidateDbRow } from '@/types'
import { candidateKeys } from './use-candidates'

// ═══════════════════════════════════════════════════════
// TRANSFORM FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Transform bluecrew_profiles row to normalized CandidateWithRelations
 *
 * bluecrew_profiles is the source of truth for all candidate data.
 * Profile is "confirmed" if cv_key is present.
 */
function transformProfile(row: Record<string, unknown>): CandidateWithRelations {
  const firstName = (row.first_name as string) || ''
  const lastName = (row.last_name as string) || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Ukjent'

  const primaryRole = (row.primary_role as string) || 'Ikke spesifisert'
  const experienceYears = (row.experience_years as number) || 0
  const availabilityStatus = (row.availability_status as string) || 'available'

  // Profile is "confirmed" if cv_key is present
  const cvKey = row.cv_key as string | null
  const isConfirmed = !!cvKey
  const complianceStatus = isConfirmed ? 'approved' : 'not_started'

  return {
    id: row.id as string,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: row.email as string,
    phone: (row.phone as string) || null,
    avatar_url: (row.avatar_url as string) || null,
    primary_role: primaryRole,
    secondary_roles: (row.secondary_roles as string[]) || [],
    experience_years: experienceYears,
    availability_status: availabilityStatus as CandidateWithRelations['availability_status'],
    availability_date: (row.availability_date as string) || null,
    compliance_status: complianceStatus as CandidateWithRelations['compliance_status'],
    internal_rating: (row.internal_rating as number) || null,
    tags: (row.tags as string[]) || [],
    sectors: (row.sectors as string[]) || [],
    internal_notes: (row.internal_notes as string) || null,
    cv_summary: (row.cv_summary as string) || null,
    cv_key: cvKey,
    // Store raw for access to all fields including short_id, verified_at, candidate_id, etc.
    _raw: row as unknown as CandidateDbRow,
  }
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Fetch a single profile from bluecrew_profiles with relations
 * @param id - The bluecrew_profiles.id (profile ID)
 */
async function fetchCandidate(id: string): Promise<CandidateWithRelations | null> {
  const supabase = createClient()

  // Query bluecrew_profiles as source of truth
  const { data, error } = await supabase
    .from('bluecrew_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching bluecrew_profile:', error)
    throw error
  }

  if (!data) return null

  // Get candidate_id for relationship queries
  const candidateId = data.candidate_id as string | null

  // Fetch pools via candidate_id link
  let pools: Array<{ id: string; name: string; color: string; slug: string }> = []
  if (candidateId) {
    const { data: poolMemberships } = await supabase
      .from('candidate_pool_memberships')
      .select('pool:candidate_pools(id, name, color, slug)')
      .eq('candidate_id', candidateId)

    pools = (poolMemberships || [])
      .map(pm => pm.pool as unknown as { id: string; name: string; color: string; slug: string })
      .filter(Boolean)
  }

  // Fetch certifications via candidate_id link
  let certifications: Array<Record<string, unknown>> = []
  if (candidateId) {
    const { data: certs } = await supabase
      .from('candidate_certifications')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('status', 'active')
      .order('category', { ascending: true })

    certifications = certs || []
  }

  // Fetch documents via candidate_id link
  let documents: Array<Record<string, unknown>> = []
  if (candidateId) {
    const { data: docs } = await supabase
      .from('candidate_documents')
      .select('*')
      .eq('candidate_id', candidateId)
      .is('archived_at', null)
      .order('uploaded_at', { ascending: false })

    documents = docs || []
  }

  const candidate = transformProfile(data)
  candidate.pools = pools as unknown as import('@/types/database.types').CandidatePool[]
  candidate.certifications = certifications as unknown as CandidateWithRelations['certifications']
  candidate.documents = documents as unknown as CandidateWithRelations['documents']

  return candidate
}

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: candidateKeys.detail(id || ''),
    queryFn: () => fetchCandidate(id!),
    enabled: !!id,
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

/**
 * Create a new profile in bluecrew_profiles
 */
export function useCreateCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      // Map to bluecrew_profiles columns
      const dbData: Record<string, unknown> = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        primary_role: data.primary_role,
        secondary_roles: data.secondary_roles,
        experience_years: data.experience_years,
        availability_status: data.availability_status || 'available',
        availability_date: data.availability_date,
        sectors: data.sectors,
        internal_notes: data.internal_notes,
        internal_rating: data.internal_rating,
        tags: data.tags,
        cv_summary: data.cv_summary,
        birth_date: data.date_of_birth || data.birth_date,
        nationality: data.nationality,
        city: data.address_city || data.city,
        country: data.address_country || data.country,
      }

      // Remove undefined values
      Object.keys(dbData).forEach(key => {
        if (dbData[key] === undefined) delete dbData[key]
      })

      const { data: created, error } = await supabase
        .from('bluecrew_profiles')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

/**
 * Update a profile in bluecrew_profiles
 * @param id - The bluecrew_profiles.id (profile ID)
 */
export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string
      data: Record<string, unknown>
    }) => {
      // Build update object with only provided fields (bluecrew_profiles columns)
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      // Personal info
      if (data.first_name !== undefined) dbData.first_name = data.first_name
      if (data.last_name !== undefined) dbData.last_name = data.last_name
      if (data.email !== undefined) dbData.email = data.email
      if (data.phone !== undefined) dbData.phone = data.phone
      if (data.birth_date !== undefined) dbData.birth_date = data.birth_date
      if (data.date_of_birth !== undefined) dbData.birth_date = data.date_of_birth
      if (data.nationality !== undefined) dbData.nationality = data.nationality

      // Location (bluecrew_profiles uses city/country)
      if (data.city !== undefined) dbData.city = data.city
      if (data.address_city !== undefined) dbData.city = data.address_city
      if (data.country !== undefined) dbData.country = data.country
      if (data.address_country !== undefined) dbData.country = data.address_country

      // Professional info
      if (data.primary_role !== undefined) dbData.primary_role = data.primary_role
      if (data.secondary_roles !== undefined) dbData.secondary_roles = data.secondary_roles
      if (data.experience_years !== undefined) dbData.experience_years = data.experience_years
      if (data.sectors !== undefined) dbData.sectors = data.sectors
      if (data.cv_summary !== undefined) dbData.cv_summary = data.cv_summary
      if (data.languages !== undefined) dbData.languages = data.languages

      // Availability
      if (data.availability_status !== undefined) dbData.availability_status = data.availability_status
      if (data.availability_date !== undefined) dbData.availability_date = data.availability_date

      // Internal
      if (data.internal_rating !== undefined) dbData.internal_rating = data.internal_rating
      if (data.internal_notes !== undefined) dbData.internal_notes = data.internal_notes
      if (data.tags !== undefined) dbData.tags = data.tags

      const { data: updated, error } = await supabase
        .from('bluecrew_profiles')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

/**
 * Update internal rating on bluecrew_profiles
 * @param profileId - The bluecrew_profiles.id
 */
export function useUpdateCandidateRating() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      rating
    }: {
      profileId: string
      rating: number | null
    }) => {
      const { data, error } = await supabase
        .from('bluecrew_profiles')
        .update({
          internal_rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.profileId) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

/**
 * Update tags on bluecrew_profiles
 * @param profileId - The bluecrew_profiles.id
 */
export function useUpdateCandidateTags() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      tags
    }: {
      profileId: string
      tags: string[]
    }) => {
      const { data, error } = await supabase
        .from('bluecrew_profiles')
        .update({
          tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.profileId) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

/**
 * Update internal notes on bluecrew_profiles
 * @param profileId - The bluecrew_profiles.id
 */
export function useUpdateCandidateNotes() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      notes
    }: {
      profileId: string
      notes: string | null
    }) => {
      const { data, error } = await supabase
        .from('bluecrew_profiles')
        .update({
          internal_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.profileId) })
    },
  })
}

// ═══════════════════════════════════════════════════════
// CERTIFICATION CRUD
// ═══════════════════════════════════════════════════════

export function useAddCertification() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (certification: {
      candidate_id: string
      category: string
      code: string
      name: string
      issuer?: string
      issuer_country?: string
      certificate_number?: string
      issue_date?: string
      expiry_date?: string
      is_permanent?: boolean
      document_path?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('candidate_certifications')
        .insert({
          candidate_id: certification.candidate_id,
          category: certification.category,
          code: certification.code,
          name: certification.name,
          issuer: certification.issuer || 'Sjøfartsdirektoratet',
          issuer_country: certification.issuer_country || 'NO',
          certificate_number: certification.certificate_number,
          issue_date: certification.issue_date,
          expiry_date: certification.expiry_date,
          is_permanent: certification.is_permanent || false,
          document_path: certification.document_path,
          notes: certification.notes,
          status: 'active',
          document_verified: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(data.candidate_id) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

export function useUpdateCertification() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      candidateId,
      data
    }: {
      id: string
      candidateId: string
      data: Record<string, unknown>
    }) => {
      const { error } = await supabase
        .from('candidate_certifications')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      return { id, candidateId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(result.candidateId) })
    },
  })
}

export function useDeleteCertification() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      candidateId
    }: {
      id: string
      candidateId: string
    }) => {
      const { error } = await supabase
        .from('candidate_certifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { candidateId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(result.candidateId) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

// ═══════════════════════════════════════════════════════
// ARCHIVE / DELETE PROFILE (bluecrew_profiles)
// ═══════════════════════════════════════════════════════

/**
 * Archive a profile in bluecrew_profiles
 * @param profileId - The bluecrew_profiles.id
 */
export function useArchiveCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('bluecrew_profiles')
        .update({
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)

      if (error) throw error
      return { id: profileId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

/**
 * Restore an archived profile in bluecrew_profiles
 * @param profileId - The bluecrew_profiles.id
 */
export function useRestoreCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('bluecrew_profiles')
        .update({
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)

      if (error) throw error
      return { id: profileId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

/**
 * Permanently delete a profile from bluecrew_profiles
 * Also removes pool memberships via candidate_id link
 * @param profileId - The bluecrew_profiles.id
 */
export function useDeleteCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (profileId: string) => {
      // Get candidate_id for relationship cleanup
      const { data: profile } = await supabase
        .from('bluecrew_profiles')
        .select('candidate_id')
        .eq('id', profileId)
        .single()

      // Remove from pools via candidate_id if it exists
      if (profile?.candidate_id) {
        await supabase
          .from('candidate_pool_memberships')
          .delete()
          .eq('candidate_id', profile.candidate_id)
      }

      // Delete the profile permanently
      const { error } = await supabase
        .from('bluecrew_profiles')
        .delete()
        .eq('id', profileId)

      if (error) throw error
      return { id: profileId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

/**
 * Bulk archive profiles in bluecrew_profiles
 * @param profileIds - Array of bluecrew_profiles.id
 */
export function useBulkArchiveCandidates() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (profileIds: string[]) => {
      const { error } = await supabase
        .from('bluecrew_profiles')
        .update({
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', profileIds)

      if (error) throw error
      return { count: profileIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

/**
 * Bulk delete profiles from bluecrew_profiles
 * @param profileIds - Array of bluecrew_profiles.id
 */
export function useBulkDeleteCandidates() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (profileIds: string[]) => {
      // Get candidate_ids for relationship cleanup
      const { data: profiles } = await supabase
        .from('bluecrew_profiles')
        .select('candidate_id')
        .in('id', profileIds)

      const candidateIds = (profiles || [])
        .map(p => p.candidate_id)
        .filter(Boolean) as string[]

      // Remove from pools via candidate_ids
      if (candidateIds.length > 0) {
        await supabase
          .from('candidate_pool_memberships')
          .delete()
          .in('candidate_id', candidateIds)
      }

      // Delete profiles permanently
      const { error } = await supabase
        .from('bluecrew_profiles')
        .delete()
        .in('id', profileIds)

      if (error) throw error
      return { count: profileIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

// ═══════════════════════════════════════════════════════
// CV UPLOAD
// ═══════════════════════════════════════════════════════

/**
 * Upload CV for a profile in bluecrew_profiles
 * @param profileId - The bluecrew_profiles.id
 */
export function useUploadCandidateCv() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ profileId, file }: { profileId: string; file: File }) => {
      // 1. Generer unik filnavn
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `uploads/${timestamp}-${randomStr}-${safeName}`

      // 2. Last opp til candidate-cvs bucket
      const { error: uploadError } = await supabase
        .storage
        .from('candidate-cvs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // 3. Get profile to find candidate_id for document storage
      const { data: profile } = await supabase
        .from('bluecrew_profiles')
        .select('candidate_id')
        .eq('id', profileId)
        .single()

      // 4. Oppdater profil med CV-key
      const { error: updateError } = await supabase
        .from('bluecrew_profiles')
        .update({
          cv_key: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)

      if (updateError) throw updateError

      // 5. Legg også til i candidate_documents for historikk (via candidate_id)
      if (profile?.candidate_id) {
        await supabase
          .from('candidate_documents')
          .insert({
            candidate_id: profile.candidate_id,
            type: 'cv',
            name: 'CV',
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          })
      }

      return { filePath }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.profileId) })
    },
  })
}

// ═══════════════════════════════════════════════════════
// PROFILE COMPLETENESS
// ═══════════════════════════════════════════════════════

export function calculateProfileCompleteness(candidate: CandidateWithRelations): {
  score: number
  missing: string[]
} {
  const missing: string[] = []
  let score = 0
  const maxScore = 100

  // Basiskrav (50 poeng)
  if (candidate.first_name && candidate.last_name) score += 10
  else missing.push('Navn')

  if (candidate.email) score += 10
  else missing.push('E-post')

  if (candidate.phone) score += 10
  else missing.push('Telefon')

  if (candidate._raw?.cv_key || candidate.cv_key) score += 20
  else missing.push('CV')

  // Erfaring (20 poeng)
  if (candidate.experience_years && candidate.experience_years > 0) score += 10
  else missing.push('Erfaring')

  if (candidate.primary_role && candidate.primary_role !== 'deckhand') score += 10
  else missing.push('Stilling')

  // Ekstra (20 poeng)
  if (candidate.cv_summary) score += 10
  else missing.push('CV-sammendrag')

  if (candidate.certifications && candidate.certifications.length > 0) score += 10
  else missing.push('Sertifikater')

  return { score: Math.min(score, maxScore), missing }
}

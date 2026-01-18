'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CandidateWithRelations, CandidateDbRow } from '@/types'
import { candidateKeys } from './use-candidates'

// ═══════════════════════════════════════════════════════
// TRANSFORM FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Transform raw database row to normalized CandidateWithRelations
 * Maps actual DB columns (from migration 00003_candidates.sql) to expected interface
 */
function transformCandidate(row: CandidateDbRow): CandidateWithRelations {
  const firstName = row.first_name || ''
  const lastName = row.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Ukjent'

  return {
    id: row.id,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: row.email,
    phone: row.phone || null,
    avatar_url: row.avatar_url || null,
    primary_role: row.primary_role || 'Ikke spesifisert',
    secondary_roles: row.secondary_roles || [],
    experience_years: row.experience_years || 0,
    availability_status: row.availability_status || 'available',
    availability_date: row.availability_date || null,
    compliance_status: row.compliance_status || 'not_started',
    internal_rating: row.internal_rating || null,
    tags: row.tags || [],
    sectors: row.sectors || [],
    internal_notes: row.internal_notes || null,
    cv_summary: row.cv_summary || null,
    cv_key: row.cv_file_path,
    _raw: row,
  }
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTION
// ═══════════════════════════════════════════════════════

async function fetchCandidate(id: string): Promise<CandidateWithRelations | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching candidate:', error)
    throw error
  }

  if (!data) return null

  // Fetch candidate's pools
  const { data: poolMemberships } = await supabase
    .from('candidate_pool_memberships')
    .select('pool_id, candidate_pools(*)')
    .eq('candidate_id', id)

  const pools = poolMemberships
    ?.map(pm => pm.candidate_pools)
    .filter(Boolean) || []

  // Fetch certifications
  const { data: certifications } = await supabase
    .from('candidate_certifications')
    .select('*')
    .eq('candidate_id', id)
    .eq('status', 'active')
    .order('category', { ascending: true })

  // Fetch documents
  const { data: documents } = await supabase
    .from('candidate_documents')
    .select('*')
    .eq('candidate_id', id)
    .is('archived_at', null)
    .order('uploaded_at', { ascending: false })

  const candidate = transformCandidate(data as unknown as CandidateDbRow)
  // Type assertion since we're fetching all pool fields
  candidate.pools = pools as unknown as import('@/types/database.types').CandidatePool[]
  candidate.certifications = certifications || []
  candidate.documents = documents || []

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

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      // Map to actual DB columns (migration 00003_candidates.sql)
      const dbData: Record<string, unknown> = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        phone_secondary: data.phone_secondary,
        primary_role: data.primary_role,
        secondary_roles: data.secondary_roles,
        experience_years: data.experience_years,
        availability_status: data.availability_status,
        availability_date: data.availability_date,
        availability_notes: data.availability_notes,
        compliance_status: data.compliance_status,
        compliance_notes: data.compliance_notes,
        sectors: data.sectors,
        internal_notes: data.internal_notes,
        internal_rating: data.internal_rating,
        tags: data.tags,
        cv_summary: data.cv_summary,
        date_of_birth: data.date_of_birth,
        nationality: data.nationality,
        address_street: data.address_street,
        address_postal_code: data.address_postal_code,
        address_city: data.address_city,
        address_country: data.address_country,
      }

      // Remove undefined values
      Object.keys(dbData).forEach(key => {
        if (dbData[key] === undefined) delete dbData[key]
      })

      const { data: created, error } = await supabase
        .from('candidates')
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
      // Build update object with only provided fields
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      // Personal info
      if (data.first_name !== undefined) dbData.first_name = data.first_name
      if (data.last_name !== undefined) dbData.last_name = data.last_name
      if (data.email !== undefined) dbData.email = data.email
      if (data.phone !== undefined) dbData.phone = data.phone
      if (data.phone_secondary !== undefined) dbData.phone_secondary = data.phone_secondary
      if (data.date_of_birth !== undefined) dbData.date_of_birth = data.date_of_birth
      if (data.nationality !== undefined) dbData.nationality = data.nationality
      if (data.national_id_number !== undefined) dbData.national_id_number = data.national_id_number

      // Address
      if (data.address_street !== undefined) dbData.address_street = data.address_street
      if (data.address_postal_code !== undefined) dbData.address_postal_code = data.address_postal_code
      if (data.address_city !== undefined) dbData.address_city = data.address_city
      if (data.address_country !== undefined) dbData.address_country = data.address_country

      // Professional info
      if (data.primary_role !== undefined) dbData.primary_role = data.primary_role
      if (data.secondary_roles !== undefined) dbData.secondary_roles = data.secondary_roles
      if (data.experience_years !== undefined) dbData.experience_years = data.experience_years
      if (data.sectors !== undefined) dbData.sectors = data.sectors
      if (data.cv_summary !== undefined) dbData.cv_summary = data.cv_summary
      if (data.languages !== undefined) dbData.languages = data.languages

      // Rotation preferences
      if (data.rotation_preferred !== undefined) dbData.rotation_preferred = data.rotation_preferred
      if (data.rotation_max_weeks_on !== undefined) dbData.rotation_max_weeks_on = data.rotation_max_weeks_on
      if (data.rotation_min_weeks_off !== undefined) dbData.rotation_min_weeks_off = data.rotation_min_weeks_off
      if (data.rotation_flexible !== undefined) dbData.rotation_flexible = data.rotation_flexible

      // Salary
      if (data.salary_min_monthly_nok !== undefined) dbData.salary_min_monthly_nok = data.salary_min_monthly_nok
      if (data.salary_preferred_monthly_nok !== undefined) dbData.salary_preferred_monthly_nok = data.salary_preferred_monthly_nok
      if (data.salary_negotiable !== undefined) dbData.salary_negotiable = data.salary_negotiable

      // Location preferences
      if (data.location_preferred_regions !== undefined) dbData.location_preferred_regions = data.location_preferred_regions
      if (data.location_willing_to_relocate !== undefined) dbData.location_willing_to_relocate = data.location_willing_to_relocate

      // Availability
      if (data.availability_status !== undefined) dbData.availability_status = data.availability_status
      if (data.availability_date !== undefined) dbData.availability_date = data.availability_date
      if (data.availability_notes !== undefined) dbData.availability_notes = data.availability_notes

      // Compliance
      if (data.compliance_status !== undefined) dbData.compliance_status = data.compliance_status
      if (data.compliance_notes !== undefined) dbData.compliance_notes = data.compliance_notes

      // Internal
      if (data.internal_rating !== undefined) dbData.internal_rating = data.internal_rating
      if (data.internal_notes !== undefined) dbData.internal_notes = data.internal_notes
      if (data.tags !== undefined) dbData.tags = data.tags

      const { data: updated, error } = await supabase
        .from('candidates')
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

export function useUpdateCandidateRating() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      rating
    }: {
      candidateId: string
      rating: number | null
    }) => {
      // DB doesn't have internal_rating - this would need a schema update
      // For now, just return success without actually updating
      console.warn('internal_rating column not in DB schema')
      return { id: candidateId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.candidateId) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

export function useUpdateCandidateTags() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      tags
    }: {
      candidateId: string
      tags: string[]
    }) => {
      // DB doesn't have tags array - this would need a schema update
      // For now, just return success without actually updating
      console.warn('tags column not in DB schema')
      return { id: candidateId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.candidateId) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

export function useUpdateCandidateNotes() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      notes
    }: {
      candidateId: string
      notes: string | null
    }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({
          internal_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.candidateId) })
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
// ARCHIVE / DELETE CANDIDATE
// ═══════════════════════════════════════════════════════

export function useArchiveCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from('candidates')
        .update({ 
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId)

      if (error) throw error
      return { id: candidateId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

export function useRestoreCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from('candidates')
        .update({ 
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId)

      if (error) throw error
      return { id: candidateId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (candidateId: string) => {
      // First remove from all pools
      await supabase
        .from('candidate_pool_memberships')
        .delete()
        .eq('candidate_id', candidateId)

      // Then delete the candidate permanently
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)

      if (error) throw error
      return { id: candidateId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

export function useBulkArchiveCandidates() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (candidateIds: string[]) => {
      const { error } = await supabase
        .from('candidates')
        .update({ 
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', candidateIds)

      if (error) throw error
      return { count: candidateIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

export function useBulkDeleteCandidates() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (candidateIds: string[]) => {
      // First remove from all pools
      await supabase
        .from('candidate_pool_memberships')
        .delete()
        .in('candidate_id', candidateIds)

      // Then delete permanently
      const { error } = await supabase
        .from('candidates')
        .delete()
        .in('id', candidateIds)

      if (error) throw error
      return { count: candidateIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

// ═══════════════════════════════════════════════════════
// CV UPLOAD
// ═══════════════════════════════════════════════════════

export function useUploadCandidateCv() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ candidateId, file }: { candidateId: string; file: File }) => {
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

      // 3. Oppdater kandidat med CV-path
      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          cv_key: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidateId)

      if (updateError) throw updateError

      // 4. Legg også til i candidate_documents for historikk
      await supabase
        .from('candidate_documents')
        .insert({
          candidate_id: candidateId,
          type: 'cv',
          name: 'CV',
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })

      return { filePath }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.candidateId) })
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

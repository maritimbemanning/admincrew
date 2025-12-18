'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Candidate,
  CandidateCertification,
  CandidateDocument,
  AvailabilityStatus,
  ComplianceStatus,
  TablesInsert,
  TablesUpdate,
} from '@/types/database.types'
import type { CandidateWithRelations } from '@/types'
import { candidateKeys } from './use-candidates'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface CandidateFullProfile extends CandidateWithRelations {
  // Extended fields from the full candidate record
  date_of_birth: string | null
  nationality: string
  national_id_number: string | null
  address_street: string | null
  address_postal_code: string | null
  address_city: string | null
  address_country: string
  kommune: string | null
  experience_details: unknown
  languages: unknown
  rotation_preferred: string[]
  rotation_max_weeks_on: number | null
  rotation_min_weeks_off: number | null
  rotation_flexible: boolean
  salary_min_monthly_nok: number | null
  salary_preferred_monthly_nok: number | null
  salary_negotiable: boolean
  location_preferred_regions: string[]
  location_willing_to_relocate: boolean
  sectors: string[]
  availability_notes: string | null
  compliance_checked_at: string | null
  compliance_notes: string | null
  compliance_expires_at: string | null
  profile_completeness: number
  cv_summary: string | null
  cv_file_path: string | null
  internal_notes: string | null
  source: string
  created_at: string
  updated_at: string
  // Pool memberships
  pool_memberships?: Array<{
    pool_id: string
    pool: {
      id: string
      name: string
      slug: string
      color: string
      icon: string
    }
  }>
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTION
// ═══════════════════════════════════════════════════════

async function fetchCandidate(id: string): Promise<CandidateFullProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select(`
      *,
      certifications:candidate_certifications(*),
      documents:candidate_documents(*),
      pool_memberships:candidate_pool_memberships(
        pool_id,
        pool:candidate_pools(
          id,
          name,
          slug,
          color,
          icon
        )
      )
    `)
    .eq('id', id)
    .is('archived_at', null)
    .single()

  if (error) {
    console.error('Error fetching candidate:', error)
    throw error
  }

  if (!data) {
    throw new Error('Candidate not found')
  }

  // Transform the data
  const candidate: CandidateFullProfile = {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    avatar_url: data.avatar_url,
    primary_role: data.primary_role,
    secondary_roles: data.secondary_roles || [],
    experience_years: data.experience_years || 0,
    availability_status: data.availability_status as AvailabilityStatus,
    availability_date: data.availability_date,
    compliance_status: data.compliance_status as ComplianceStatus,
    internal_rating: data.internal_rating,
    tags: data.tags || [],
    fylke: data.fylke,
    certifications: data.certifications as CandidateCertification[] || [],
    documents: data.documents as CandidateDocument[] || [],
    // Extended fields
    date_of_birth: data.date_of_birth,
    nationality: data.nationality,
    national_id_number: data.national_id_number,
    address_street: data.address_street,
    address_postal_code: data.address_postal_code,
    address_city: data.address_city,
    address_country: data.address_country,
    kommune: data.kommune,
    experience_details: data.experience_details,
    languages: data.languages,
    rotation_preferred: data.rotation_preferred || [],
    rotation_max_weeks_on: data.rotation_max_weeks_on,
    rotation_min_weeks_off: data.rotation_min_weeks_off,
    rotation_flexible: data.rotation_flexible,
    salary_min_monthly_nok: data.salary_min_monthly_nok,
    salary_preferred_monthly_nok: data.salary_preferred_monthly_nok,
    salary_negotiable: data.salary_negotiable,
    location_preferred_regions: data.location_preferred_regions || [],
    location_willing_to_relocate: data.location_willing_to_relocate,
    sectors: data.sectors || [],
    availability_notes: data.availability_notes,
    compliance_checked_at: data.compliance_checked_at,
    compliance_notes: data.compliance_notes,
    compliance_expires_at: data.compliance_expires_at,
    profile_completeness: data.profile_completeness || 0,
    cv_summary: data.cv_summary,
    cv_file_path: data.cv_file_path,
    internal_notes: data.internal_notes,
    source: data.source,
    created_at: data.created_at,
    updated_at: data.updated_at,
    // Pool memberships - flatten the nested structure
    pool_memberships: data.pool_memberships?.map((pm: { pool_id: string; pool: unknown }) => ({
      pool_id: pm.pool_id,
      pool: pm.pool as { id: string; name: string; slug: string; color: string; icon: string },
    })),
    pools: data.pool_memberships?.map((pm: { pool: unknown }) => pm.pool as { id: string; name: string; slug: string; color: string; icon: string }) || [],
  }

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
    mutationFn: async (data: TablesInsert<'candidates'>) => {
      const { data: created, error } = await supabase
        .from('candidates')
        .insert(data)
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
      data: TablesUpdate<'candidates'>
    }) => {
      const { data: updated, error } = await supabase
        .from('candidates')
        .update(data)
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
      const { data, error } = await supabase
        .from('candidates')
        .update({ internal_rating: rating })
        .eq('id', candidateId)
        .select()
        .single()

      if (error) throw error
      return data
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
      const { data, error } = await supabase
        .from('candidates')
        .update({ tags })
        .eq('id', candidateId)
        .select()
        .single()

      if (error) throw error
      return data
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
        .update({ internal_notes: notes })
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
// CERTIFICATION MUTATIONS
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
    }) => {
      const { data, error } = await supabase
        .from('candidate_certifications')
        .insert(certification)
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
      data: Partial<CandidateCertification>
    }) => {
      const { data: updated, error } = await supabase
        .from('candidate_certifications')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { updated, candidateId }
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

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Candidate,
  CandidateCertification,
  CandidatePool,
  AvailabilityStatus,
  ComplianceStatus
} from '@/types/database.types'
import type { CandidateFilters, CandidateSort, CandidateWithRelations } from '@/types'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface UseCandidatesOptions {
  filters?: CandidateFilters
  sort?: CandidateSort
  page?: number
  pageSize?: number
  poolId?: string
}

interface CandidatesResult {
  candidates: CandidateWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ═══════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════

export const candidateKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidateKeys.all, 'list'] as const,
  list: (options: UseCandidatesOptions) => [...candidateKeys.lists(), options] as const,
  details: () => [...candidateKeys.all, 'detail'] as const,
  detail: (id: string) => [...candidateKeys.details(), id] as const,
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTION
// ═══════════════════════════════════════════════════════

async function fetchCandidates(options: UseCandidatesOptions): Promise<CandidatesResult> {
  const supabase = createClient()
  const { filters, sort, page = 1, pageSize = 25, poolId } = options

  // Start building query
  let query = supabase
    .from('candidates')
    .select(`
      *,
      certifications:candidate_certifications(*),
      documents:candidate_documents(*)
    `, { count: 'exact' })
    .is('archived_at', null)

  // Pool filter - join through pool_memberships
  if (poolId && poolId !== 'alle') {
    // For pool filtering, we need a different approach
    const { data: membershipData } = await supabase
      .from('candidate_pool_memberships')
      .select('candidate_id')
      .eq('pool_id', poolId)

    const candidateIds = membershipData?.map(m => m.candidate_id) || []
    if (candidateIds.length > 0) {
      query = query.in('id', candidateIds)
    } else {
      // No candidates in pool
      return { candidates: [], total: 0, page, pageSize, totalPages: 0 }
    }
  }

  // Text search
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},primary_role.ilike.${searchTerm}`)
  }

  // Role filter
  if (filters?.roles && filters.roles.length > 0) {
    query = query.in('primary_role', filters.roles)
  }

  // Availability filter
  if (filters?.availability && filters.availability.length > 0) {
    query = query.in('availability_status', filters.availability)
  }

  // Compliance filter
  if (filters?.compliance && filters.compliance.length > 0) {
    query = query.in('compliance_status', filters.compliance)
  }

  // Experience filter
  if (filters?.experience?.min !== undefined) {
    query = query.gte('experience_years', filters.experience.min)
  }
  if (filters?.experience?.max !== undefined) {
    query = query.lte('experience_years', filters.experience.max)
  }

  // Location filter
  if (filters?.location?.fylke && filters.location.fylke.length > 0) {
    query = query.in('fylke', filters.location.fylke)
  }

  // Rating filter
  if (filters?.rating?.min !== undefined) {
    query = query.gte('internal_rating', filters.rating.min)
  }

  // Tags filter
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags)
  }

  // Sorting
  const sortField = sort?.field || 'updated_at'
  const sortDirection = sort?.direction || 'desc'

  const sortMapping: Record<string, string> = {
    name: 'first_name',
    role: 'primary_role',
    experience: 'experience_years',
    availability: 'availability_status',
    rating: 'internal_rating',
    created_at: 'created_at',
    updated_at: 'updated_at',
  }

  const dbSortField = sortMapping[sortField] || 'updated_at'
  query = query.order(dbSortField, { ascending: sortDirection === 'asc', nullsFirst: false })

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  // Execute query
  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching candidates:', error)
    throw error
  }

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  // Transform to CandidateWithRelations
  const candidates: CandidateWithRelations[] = (data || []).map(candidate => ({
    id: candidate.id,
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone,
    avatar_url: candidate.avatar_url,
    primary_role: candidate.primary_role,
    secondary_roles: candidate.secondary_roles || [],
    experience_years: candidate.experience_years || 0,
    availability_status: candidate.availability_status as AvailabilityStatus,
    availability_date: candidate.availability_date,
    compliance_status: candidate.compliance_status as ComplianceStatus,
    internal_rating: candidate.internal_rating,
    tags: candidate.tags || [],
    fylke: candidate.fylke,
    certifications: candidate.certifications as CandidateCertification[] || [],
    documents: candidate.documents || [],
  }))

  return { candidates, total, page, pageSize, totalPages }
}

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════

export function useCandidates(options: UseCandidatesOptions = {}) {
  return useQuery({
    queryKey: candidateKeys.list(options),
    queryFn: () => fetchCandidates(options),
    placeholderData: (previousData) => previousData,
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export function useUpdateCandidateAvailability() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      status,
      date
    }: {
      candidateId: string
      status: AvailabilityStatus
      date?: string
    }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({
          availability_status: status,
          availability_date: date || null,
          availability_updated_at: new Date().toISOString(),
        })
        .eq('id', candidateId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

export function useAddCandidateToPool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      poolId,
      notes,
    }: {
      candidateId: string
      poolId: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('candidate_pool_memberships')
        .upsert({
          candidate_id: candidateId,
          pool_id: poolId,
          notes,
        }, { onConflict: 'pool_id,candidate_id' })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
      queryClient.invalidateQueries({ queryKey: ['pools'] })
    },
  })
}

export function useRemoveCandidateFromPool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      poolId,
    }: {
      candidateId: string
      poolId: string
    }) => {
      const { error } = await supabase
        .from('candidate_pool_memberships')
        .delete()
        .eq('candidate_id', candidateId)
        .eq('pool_id', poolId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
      queryClient.invalidateQueries({ queryKey: ['pools'] })
    },
  })
}

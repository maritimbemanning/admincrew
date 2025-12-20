'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AvailabilityStatus, ComplianceStatus } from '@/types/database.types'
import type { CandidateFilters, CandidateSort, CandidateWithRelations, CandidateDbRow } from '@/types'

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
// TRANSFORM FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Transform raw database row to normalized CandidateWithRelations
 * DB now has correct column names matching CLAUDE.md spec
 */
function transformCandidate(row: CandidateDbRow): CandidateWithRelations {
  // DB has proper columns now - read directly
  const fullName = row.name || `${row.first_name} ${row.last_name}`.trim()

  return {
    id: row.id,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    full_name: fullName,
    email: row.email,
    phone: row.phone || row.phone_secondary || null,
    avatar_url: row.avatar_url || null,
    primary_role: row.primary_role || 'Ikke spesifisert',
    secondary_roles: row.secondary_roles || [],
    experience_years: row.experience_years || 0,
    availability_status: row.availability_status || 'available',
    availability_date: row.availability_date || null,
    compliance_status: row.compliance_status || 'not_started',
    internal_rating: row.internal_rating || null,
    tags: row.tags || [],
    fylke: row.fylke || null,
    kommune: row.kommune || null,
    sectors: row.sectors || [],
    internal_notes: row.internal_notes || null,
    cv_summary: row.cv_summary || null,
    // Store raw for access to all fields
    _raw: row,
  }
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTION
// ═══════════════════════════════════════════════════════

async function fetchCandidates(options: UseCandidatesOptions): Promise<CandidatesResult> {
  const supabase = createClient()
  const { filters, sort, page = 1, pageSize = 25, poolId } = options

  // Start building query - select all columns, no joins
  // (candidate_certifications table may not exist in actual DB)
  let query = supabase
    .from('candidates')
    .select('*', { count: 'exact' })
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

  // Text search - use actual DB columns
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    // Search in name, email, and work_main array
    query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},primary_rank.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
  }

  // Role filter - search in work_main array
  if (filters?.roles && filters.roles.length > 0) {
    // Use overlaps for array column or filter primary_rank
    query = query.or(`work_main.ov.{${filters.roles.join(',')}},primary_rank.in.(${filters.roles.join(',')})`)
  }

  // Availability filter - map to actual DB status values
  if (filters?.availability && filters.availability.length > 0) {
    // Map app status values to DB values
    const dbStatuses = filters.availability.map(status => {
      switch (status) {
        case 'available': return 'godkjent'
        case 'on_assignment': return 'ansatt'
        case 'available_soon': return 'pending'
        case 'unavailable': return 'avslått'
        case 'inactive': return 'inaktiv'
        default: return status
      }
    })
    query = query.in('status', dbStatuses)
  }

  // Compliance filter - map to actual DB compliance_state values
  if (filters?.compliance && filters.compliance.length > 0) {
    const dbStates = filters.compliance.map(status => {
      switch (status) {
        case 'approved': return 'verified'
        case 'review_pending': return 'pending'
        default: return status
      }
    })
    query = query.in('compliance_state', dbStates)
  }

  // Experience filter - use years_of_experience column
  if (filters?.experience?.min !== undefined) {
    query = query.gte('years_of_experience', filters.experience.min)
  }
  if (filters?.experience?.max !== undefined) {
    query = query.lte('years_of_experience', filters.experience.max)
  }

  // Location filter - try both fylke and county columns
  if (filters?.location?.fylke && filters.location.fylke.length > 0) {
    query = query.or(`fylke.in.(${filters.location.fylke.join(',')}),county.in.(${filters.location.fylke.join(',')})`)
  }

  // Rating filter - DB doesn't have internal_rating, skip
  // Tags filter - DB doesn't have tags array, skip

  // Sorting - map to actual DB columns
  const sortField = sort?.field || 'updated_at'
  const sortDirection = sort?.direction || 'desc'

  const sortMapping: Record<string, string> = {
    name: 'name',
    role: 'primary_rank',
    experience: 'years_of_experience',
    availability: 'status',
    rating: 'created_at', // Fallback since no rating
    created_at: 'created_at',
    updated_at: 'updated_at',
  }

  const dbSortField = sortMapping[sortField] || 'created_at'
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

  // Transform to CandidateWithRelations using mapping functions
  const candidates: CandidateWithRelations[] = (data || []).map(row =>
    transformCandidate(row as unknown as CandidateDbRow)
  )

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
          updated_at: new Date().toISOString(),
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

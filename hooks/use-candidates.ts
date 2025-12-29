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
 * Maps actual DB columns to expected interface
 *
 * Actual DB columns:
 * - name (not first_name/last_name combo)
 * - primary_rank or rolle (not primary_role)
 * - years_of_experience or erfaring (not experience_years)
 * - employment_status (not availability_status)
 * - verification_status (not compliance_status)
 * - available_from/available_until (not availability_date)
 */
function transformCandidate(row: CandidateDbRow): CandidateWithRelations {
  // Parse name - DB has 'name' column
  const fullName = row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Ukjent'
  const nameParts = fullName.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  // Map rolle/primary_rank to primary_role
  const primaryRole = row.primary_rank || row.rolle || 'Ikke spesifisert'

  // Map years_of_experience or parse erfaring
  let experienceYears = row.years_of_experience || 0
  if (!experienceYears && row.erfaring) {
    // erfaring might be text like "5 år" - try to parse
    const match = row.erfaring.match(/(\d+)/)
    if (match) experienceYears = parseInt(match[1], 10)
  }

  // Map employment_status to availability_status
  const availabilityStatus = row.employment_status || 'available'

  // Map verification_status to compliance_status
  const complianceStatus = row.verification_status || row.compliance_state || 'pending_bankid'

  return {
    id: row.id,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: row.email,
    phone: row.phone || row.mobile || null,
    avatar_url: row.avatar_url || null,
    primary_role: primaryRole,
    secondary_roles: row.secondary_ranks || [],
    experience_years: experienceYears,
    availability_status: availabilityStatus as CandidateWithRelations['availability_status'],
    availability_date: row.available_from || null,
    compliance_status: complianceStatus as CandidateWithRelations['compliance_status'],
    internal_rating: row.internal_rating || null,
    tags: row.tags || [],
    fylke: row.fylke || row.county || null,
    kommune: row.kommune || row.municipality || null,
    sectors: row.sectors || [],
    internal_notes: row.internal_notes || null,
    cv_summary: row.cv_summary || null,
    // Additional fields from actual DB
    status: row.status,
    pipeline_stage: row.pipeline_stage,
    cv_key: row.cv_key,
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
  let query = supabase
    .from('candidates')
    .select('*', { count: 'exact' })
    .is('archived_at', null)

  // Pool filter - join through pool_memberships
  if (poolId && poolId !== 'alle') {
    const { data: membershipData } = await supabase
      .from('candidate_pool_memberships')
      .select('candidate_id')
      .eq('pool_id', poolId)

    const candidateIds = membershipData?.map(m => m.candidate_id) || []
    if (candidateIds.length > 0) {
      query = query.in('id', candidateIds)
    } else {
      return { candidates: [], total: 0, page, pageSize, totalPages: 0 }
    }
  }

  // Text search - use actual DB columns: name, email, primary_rank, rolle
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},primary_rank.ilike.${searchTerm},rolle.ilike.${searchTerm}`)
  }

  // Role filter - search in primary_rank (actual DB column)
  if (filters?.roles && filters.roles.length > 0) {
    query = query.in('primary_rank', filters.roles)
  }

  // Status filter - use status or pipeline_stage column
  if (filters?.status && filters.status.length > 0) {
    // Check if filtering by pipeline_stage values or status values
    const pipelineValues = filters.status.filter(s => ['ny', 'vurdert', 'kontaktet'].includes(s))
    const statusValues = filters.status.filter(s => ['pending', 'godkjent', 'avslått', 'ansatt'].includes(s))

    if (pipelineValues.length > 0 && statusValues.length > 0) {
      // Filter by both - OR condition
      query = query.or(`pipeline_stage.in.(${pipelineValues.join(',')}),status.in.(${statusValues.join(',')})`)
    } else if (pipelineValues.length > 0) {
      query = query.in('pipeline_stage', pipelineValues)
    } else if (statusValues.length > 0) {
      query = query.in('status', statusValues)
    }
  }

  // Availability filter - use employment_status column (actual DB column)
  if (filters?.availability && filters.availability.length > 0) {
    query = query.in('employment_status', filters.availability)
  }

  // Compliance filter - use verification_status column (actual DB column)
  if (filters?.compliance && filters.compliance.length > 0) {
    query = query.in('verification_status', filters.compliance)
  }

  // Experience filter - use years_of_experience column (actual DB column)
  if (filters?.experience?.min !== undefined) {
    query = query.gte('years_of_experience', filters.experience.min)
  }
  if (filters?.experience?.max !== undefined) {
    query = query.lte('years_of_experience', filters.experience.max)
  }

  // Location filter - fylke exists in actual DB
  if (filters?.location?.fylke && filters.location.fylke.length > 0) {
    query = query.in('fylke', filters.location.fylke)
  }

  // Rating filter - internal_rating may not exist in actual DB, skip if column doesn't exist
  // if (filters?.rating?.min !== undefined) {
  //   query = query.gte('internal_rating', filters.rating.min)
  // }

  // Tags filter - tags column may not exist in actual DB
  // if (filters?.tags && filters.tags.length > 0) {
  //   query = query.overlaps('tags', filters.tags)
  // }

  // Sorting - map to actual DB columns
  const sortField = sort?.field || 'updated_at'
  const sortDirection = sort?.direction || 'desc'

  const sortMapping: Record<string, string> = {
    name: 'name',
    role: 'primary_rank',
    experience: 'years_of_experience',
    availability: 'employment_status',
    rating: 'created_at', // fallback - internal_rating doesn't exist
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

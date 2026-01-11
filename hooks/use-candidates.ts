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
 * Actual DB columns (from migration 00003_candidates.sql):
 * - first_name, last_name (separate fields)
 * - primary_role
 * - experience_years
 * - availability_status
 * - compliance_status
 * - availability_date
 */
function transformCandidate(row: CandidateDbRow): CandidateWithRelations {
  // DB has separate first_name and last_name columns
  const firstName = row.first_name || ''
  const lastName = row.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Ukjent'

  // primary_role is the correct column name
  const primaryRole = row.primary_role || 'Ikke spesifisert'

  // experience_years is the correct column name
  const experienceYears = row.experience_years || 0

  // availability_status is the correct column name
  const availabilityStatus = row.availability_status || 'available'

  // compliance_status is the correct column name
  const complianceStatus = row.compliance_status || 'not_started'

  return {
    id: row.id,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: row.email,
    phone: row.phone || null,
    avatar_url: row.avatar_url || null,
    primary_role: primaryRole,
    secondary_roles: row.secondary_roles || [],
    experience_years: experienceYears,
    availability_status: availabilityStatus as CandidateWithRelations['availability_status'],
    availability_date: row.availability_date || null,
    compliance_status: complianceStatus as CandidateWithRelations['compliance_status'],
    internal_rating: row.internal_rating || null,
    tags: row.tags || [],
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

  // Text search - use actual DB columns: first_name, last_name, email, primary_role
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},primary_role.ilike.${searchTerm}`)
  }

  // Role filter - search in primary_role (actual DB column)
  if (filters?.roles && filters.roles.length > 0) {
    query = query.in('primary_role', filters.roles)
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

  // Availability filter - use availability_status column (actual DB column)
  if (filters?.availability && filters.availability.length > 0) {
    query = query.in('availability_status', filters.availability)
  }

  // Compliance filter - use compliance_status column (actual DB column)
  if (filters?.compliance && filters.compliance.length > 0) {
    query = query.in('compliance_status', filters.compliance)
  }

  // Experience filter - use experience_years column (actual DB column)
  if (filters?.experience?.min !== undefined) {
    query = query.gte('experience_years', filters.experience.min)
  }
  if (filters?.experience?.max !== undefined) {
    query = query.lte('experience_years', filters.experience.max)
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

  // Get candidate IDs for loading relations
  const candidateIds = (data || []).map(c => c.id)

  // Fetch certifications for all candidates
  type CertInfo = { id: string; code: string; name: string; expiry_date: string | null; is_permanent: boolean; issuer: string | null; document_verified: boolean }
  let certificationsMap: Record<string, Array<CertInfo>> = {}
  if (candidateIds.length > 0) {
    const { data: certifications } = await supabase
      .from('candidate_certifications')
      .select('id, candidate_id, code, name, expiry_date, is_permanent, issuer, document_verified, status')
      .in('candidate_id', candidateIds)
      .eq('status', 'active')

    // Group certifications by candidate_id
    certificationsMap = (certifications || []).reduce((acc, cert) => {
      if (!acc[cert.candidate_id]) {
        acc[cert.candidate_id] = []
      }
      acc[cert.candidate_id].push({
        id: cert.id,
        code: cert.code,
        name: cert.name,
        expiry_date: cert.expiry_date,
        is_permanent: cert.is_permanent ?? false,
        issuer: cert.issuer ?? null,
        document_verified: cert.document_verified ?? false,
      })
      return acc
    }, {} as Record<string, Array<CertInfo>>)
  }

  // Fetch pool memberships with pool details
  let poolsMap: Record<string, Array<{ id: string; name: string; color: string; slug: string }>> = {}
  if (candidateIds.length > 0) {
    const { data: poolMemberships } = await supabase
      .from('candidate_pool_memberships')
      .select('candidate_id, pool:candidate_pools(id, name, color, slug)')
      .in('candidate_id', candidateIds)

    // Group pools by candidate_id
    poolsMap = (poolMemberships || []).reduce((acc, membership) => {
      if (!acc[membership.candidate_id]) {
        acc[membership.candidate_id] = []
      }
      // pool is a single object from the join
      const pool = membership.pool as unknown as { id: string; name: string; color: string; slug: string } | null
      if (pool) {
        acc[membership.candidate_id].push(pool)
      }
      return acc
    }, {} as Record<string, Array<{ id: string; name: string; color: string; slug: string }>>)
  }

  // Transform to CandidateWithRelations using mapping functions
  const candidates: CandidateWithRelations[] = (data || []).map(row => {
    const candidate = transformCandidate(row as unknown as CandidateDbRow)
    // Attach certifications and pools
    candidate.certifications = certificationsMap[row.id] || []
    candidate.pools = poolsMap[row.id] || []
    return candidate
  })

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

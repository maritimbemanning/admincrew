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
    // Store raw for access to all fields including short_id, verified_at, etc.
    _raw: row as unknown as CandidateDbRow,
  }
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTION
// ═══════════════════════════════════════════════════════

async function fetchCandidates(options: UseCandidatesOptions): Promise<CandidatesResult> {
  const supabase = createClient()
  const { filters, sort, page = 1, pageSize = 25, poolId } = options

  // Query bluecrew_profiles as source of truth
  let query = supabase
    .from('bluecrew_profiles')
    .select('*', { count: 'exact' })
    .is('archived_at', null)

  // Pool filter - join through candidate_id
  if (poolId && poolId !== 'alle') {
    const { data: membershipData } = await supabase
      .from('candidate_pool_memberships')
      .select('candidate_id')
      .eq('pool_id', poolId)

    const candidateIds = membershipData?.map(m => m.candidate_id) || []
    if (candidateIds.length > 0) {
      // Filter bluecrew_profiles by their candidate_id link
      query = query.in('candidate_id', candidateIds)
    } else {
      return { candidates: [], total: 0, page, pageSize, totalPages: 0 }
    }
  }

  // Text search
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},primary_role.ilike.${searchTerm},short_id.ilike.${searchTerm}`)
  }

  // Role filter
  if (filters?.roles && filters.roles.length > 0) {
    query = query.in('primary_role', filters.roles)
  }

  // Status filter - map to confirmed/unconfirmed based on cv_key
  if (filters?.status && filters.status.length > 0) {
    // 'godkjent' = has cv_key, 'pending' = no cv_key
    const hasConfirmed = filters.status.includes('godkjent') || filters.status.includes('approved')
    const hasPending = filters.status.includes('pending') || filters.status.includes('not_started')

    if (hasConfirmed && !hasPending) {
      query = query.not('cv_key', 'is', null)
    } else if (hasPending && !hasConfirmed) {
      query = query.is('cv_key', null)
    }
  }

  // Availability filter
  if (filters?.availability && filters.availability.length > 0) {
    query = query.in('availability_status', filters.availability)
  }

  // Compliance filter - map to cv_key presence
  if (filters?.compliance && filters.compliance.length > 0) {
    const hasApproved = filters.compliance.includes('approved')
    const hasPending = filters.compliance.some(c => ['not_started', 'documents_pending', 'review_pending'].includes(c))

    if (hasApproved && !hasPending) {
      query = query.not('cv_key', 'is', null)
    } else if (hasPending && !hasApproved) {
      query = query.is('cv_key', null)
    }
  }

  // Experience filter
  if (filters?.experience?.min !== undefined) {
    query = query.gte('experience_years', filters.experience.min)
  }
  if (filters?.experience?.max !== undefined) {
    query = query.lte('experience_years', filters.experience.max)
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
    console.error('Error fetching bluecrew_profiles:', error)
    throw error
  }

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  // Get candidate_ids for loading relations (certs, pools)
  const candidateIds = (data || []).map(p => p.candidate_id).filter(Boolean) as string[]

  // Fetch certifications and pool memberships in parallel
  type CertInfo = { id: string; code: string; name: string; expiry_date: string | null; is_permanent: boolean; issuer: string | null; document_verified: boolean }
  let certificationsMap: Record<string, Array<CertInfo>> = {}
  let poolsMap: Record<string, Array<{ id: string; name: string; color: string; slug: string }>> = {}

  if (candidateIds.length > 0) {
    const [certificationsResult, poolMembershipsResult] = await Promise.all([
      // Fetch certifications via candidate_id link
      supabase
        .from('candidate_certifications')
        .select('id, candidate_id, code, name, expiry_date, is_permanent, issuer, document_verified, status')
        .in('candidate_id', candidateIds)
        .eq('status', 'active'),

      // Fetch pool memberships via candidate_id link
      supabase
        .from('candidate_pool_memberships')
        .select('candidate_id, pool:candidate_pools(id, name, color, slug)')
        .in('candidate_id', candidateIds),
    ])

    // Process certifications
    const certifications = certificationsResult.data
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

    // Process pool memberships
    const poolMemberships = poolMembershipsResult.data
    poolsMap = (poolMemberships || []).reduce((acc, membership) => {
      if (!acc[membership.candidate_id]) {
        acc[membership.candidate_id] = []
      }
      const pool = membership.pool as unknown as { id: string; name: string; color: string; slug: string } | null
      if (pool) {
        acc[membership.candidate_id].push(pool)
      }
      return acc
    }, {} as Record<string, Array<{ id: string; name: string; color: string; slug: string }>>)
  }

  // Transform to CandidateWithRelations
  const candidates: CandidateWithRelations[] = (data || []).map(row => {
    const candidate = transformProfile(row)
    // Attach certifications and pools via candidate_id link
    const candidateId = row.candidate_id as string
    candidate.certifications = certificationsMap[candidateId] || []
    candidate.pools = poolsMap[candidateId] || []
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

/**
 * Update availability status on bluecrew_profiles
 * @param profileId - The bluecrew_profiles.id (NOT candidate_id)
 */
export function useUpdateCandidateAvailability() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      status,
      date
    }: {
      profileId: string
      status: AvailabilityStatus
      date?: string
    }) => {
      const { data, error } = await supabase
        .from('bluecrew_profiles')
        .update({
          availability_status: status,
          availability_date: date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
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

/**
 * Add a candidate to a pool via candidate_pool_memberships
 * @param candidateId - The bluecrew_profiles.candidate_id (relationship link, NOT profile.id)
 * @param poolId - The candidate_pools.id
 */
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

/**
 * Remove a candidate from a pool
 * @param candidateId - The bluecrew_profiles.candidate_id (relationship link, NOT profile.id)
 * @param poolId - The candidate_pools.id
 */
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

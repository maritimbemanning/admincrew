'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CandidatePool, TablesInsert, TablesUpdate } from '@/types/database.types'
import type { PoolFilterCriteria } from '@/types'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface PoolWithCount extends CandidatePool {
  member_count: number
}

// ═══════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════

export const poolKeys = {
  all: ['pools'] as const,
  lists: () => [...poolKeys.all, 'list'] as const,
  list: (options?: { includeArchived?: boolean }) => [...poolKeys.lists(), options] as const,
  details: () => [...poolKeys.all, 'detail'] as const,
  detail: (id: string) => [...poolKeys.details(), id] as const,
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════

async function fetchPools(options?: { includeArchived?: boolean }): Promise<PoolWithCount[]> {
  const supabase = createClient()

  // Fetch pools
  let query = supabase
    .from('candidate_pools')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (!options?.includeArchived) {
    query = query.is('archived_at', null)
  }

  const { data: pools, error: poolsError } = await query

  if (poolsError) {
    console.error('Error fetching pools:', poolsError)
    throw poolsError
  }

  if (!pools || pools.length === 0) {
    return []
  }

  // Fetch member counts for each pool
  const poolIds = pools.map(p => p.id)

  // Get counts from memberships table
  const { data: memberships, error: membershipError } = await supabase
    .from('candidate_pool_memberships')
    .select('pool_id')
    .in('pool_id', poolIds)

  if (membershipError) {
    console.error('Error fetching pool memberships:', membershipError)
    // Continue without counts rather than failing
  }

  // Count memberships per pool
  const memberCounts: Record<string, number> = {}
  if (memberships) {
    memberships.forEach(m => {
      memberCounts[m.pool_id] = (memberCounts[m.pool_id] || 0) + 1
    })
  }

  // Also get total profiles count for "Alle" pool (from bluecrew_profiles)
  const { count: totalCandidates } = await supabase
    .from('bluecrew_profiles')
    .select('*', { count: 'exact', head: true })
    .is('archived_at', null)

  // Combine pools with their counts
  const poolsWithCounts: PoolWithCount[] = pools.map(pool => {
    // For system pools with smart filters, we need different logic
    let memberCount = memberCounts[pool.id] || 0

    if (pool.is_system && pool.slug === 'alle') {
      memberCount = totalCandidates || 0
    }
    // For other smart pools, use the stored candidate_count if available
    if (pool.pool_type === 'smart' && pool.candidate_count > 0) {
      memberCount = pool.candidate_count
    }

    return {
      ...pool,
      member_count: memberCount,
    }
  })

  return poolsWithCounts
}

async function fetchPool(id: string): Promise<PoolWithCount> {
  const supabase = createClient()

  const { data: pool, error } = await supabase
    .from('candidate_pools')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching pool:', error)
    throw error
  }

  // Get member count
  const { count } = await supabase
    .from('candidate_pool_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('pool_id', id)

  return {
    ...pool,
    member_count: count || 0,
  }
}

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════

export function usePools(options?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: poolKeys.list(options),
    queryFn: () => fetchPools(options),
  })
}

export function usePool(id: string | undefined) {
  return useQuery({
    queryKey: poolKeys.detail(id || ''),
    queryFn: () => fetchPool(id!),
    enabled: !!id,
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export function useCreatePool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (pool: {
      name: string
      description?: string
      color?: string
      icon?: string
      pool_type?: 'static' | 'smart'
      filter_criteria?: PoolFilterCriteria
    }) => {
      // Generate slug from name
      const slug = pool.name
        .toLowerCase()
        .replace(/[æ]/g, 'ae')
        .replace(/[ø]/g, 'o')
        .replace(/[å]/g, 'a')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('candidate_pools')
        .insert({
          name: pool.name,
          slug,
          description: pool.description,
          color: pool.color || '#3B82F6',
          icon: pool.icon || 'folder',
          pool_type: pool.pool_type || 'static',
          filter_criteria: pool.filter_criteria ? JSON.stringify(pool.filter_criteria) : null,
          is_system: false,
          is_visible: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poolKeys.all })
    },
  })
}

export function useUpdatePool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string
      data: TablesUpdate<'candidate_pools'>
    }) => {
      const { data: updated, error } = await supabase
        .from('candidate_pools')
        .update(data)
        .eq('id', id)
        .eq('is_system', false) // Prevent updating system pools
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: poolKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: poolKeys.lists() })
    },
  })
}

export function useDeletePool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by setting archived_at
      const { error } = await supabase
        .from('candidate_pools')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .eq('is_system', false) // Prevent deleting system pools

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poolKeys.all })
    },
  })
}

// ═══════════════════════════════════════════════════════
// POOL MEMBERSHIP MUTATIONS
// ═══════════════════════════════════════════════════════

export function useBulkAddToPool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      poolId,
      candidateIds
    }: {
      poolId: string
      candidateIds: string[]
    }) => {
      const memberships = candidateIds.map(candidateId => ({
        pool_id: poolId,
        candidate_id: candidateId,
      }))

      const { data, error } = await supabase
        .from('candidate_pool_memberships')
        .upsert(memberships, { onConflict: 'pool_id,candidate_id' })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poolKeys.all })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useBulkRemoveFromPool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      poolId,
      candidateIds
    }: {
      poolId: string
      candidateIds: string[]
    }) => {
      const { error } = await supabase
        .from('candidate_pool_memberships')
        .delete()
        .eq('pool_id', poolId)
        .in('candidate_id', candidateIds)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poolKeys.all })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

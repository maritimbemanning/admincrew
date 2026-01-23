'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { flattenRequest } from '@/lib/utils/flatten-request'
import type { CustomerRequest, RequestShortlist, ShortlistStatus } from '@/types/operations'
import { requestKeys } from './use-requests'

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE REQUEST
// ═══════════════════════════════════════════════════════════════════════════════

export function useRequest(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: requestKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('customer_requests')
        .select(`
          *,
          organization:crm_organizations!organization_id(id, name),
          contact:crm_contacts!contact_id(id, name, email, phone),
          shortlist_count:request_shortlists(count)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Flatten requirements JSON and normalize data
      return flattenRequest(data)
    },
    enabled: !!id,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHORTLIST
// ═══════════════════════════════════════════════════════════════════════════════

export const shortlistKeys = {
  all: ['shortlists'] as const,
  forRequest: (requestId: string) => [...shortlistKeys.all, 'request', requestId] as const,
}

export function useRequestShortlist(requestId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: shortlistKeys.forRequest(requestId || ''),
    queryFn: async () => {
      if (!requestId) return []

      const { data, error } = await supabase
        .from('request_shortlists')
        .select(`
          *,
          candidate:candidates(
            id,
            first_name,
            last_name,
            primary_role,
            avatar_url,
            availability_status,
            compliance_status,
            internal_rating,
            email,
            phone
          )
        `)
        .eq('request_id', requestId)
        .order('rank_position', { ascending: true, nullsFirst: false })
        .order('match_score', { ascending: false })

      if (error) throw error
      return data as RequestShortlist[]
    },
    enabled: !!requestId,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHORTLIST MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface MatchBreakdown {
  certifications?: { score: number; matched: string[]; missing: string[] }
  experience?: { score: number; years: number }
  availability?: { score: number; status: string }
  rating?: { score: number; rating: number | null }
  proximity?: { score: number; fylke: string | null }
}

interface AddToShortlistInput {
  request_id: string
  candidate_id: string
  match_score?: number
  match_breakdown?: MatchBreakdown
  notes?: string
}

export function useAddToShortlist() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: AddToShortlistInput) => {
      // Get current max rank
      const { data: existing } = await supabase
        .from('request_shortlists')
        .select('rank_position')
        .eq('request_id', input.request_id)
        .order('rank_position', { ascending: false })
        .limit(1)

      const nextRank = existing && existing.length > 0 && existing[0].rank_position
        ? existing[0].rank_position + 1
        : 1

      const { data, error } = await supabase
        .from('request_shortlists')
        .insert({
          ...input,
          rank_position: nextRank,
          status: 'proposed',
        })
        .select()
        .single()

      if (error) throw error
      return data as RequestShortlist
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shortlistKeys.forRequest(variables.request_id) })
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}

export function useBatchAddToShortlist() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (inputs: AddToShortlistInput[]) => {
      if (inputs.length === 0) return []

      const requestId = inputs[0].request_id

      // Get current max rank
      const { data: existing } = await supabase
        .from('request_shortlists')
        .select('rank_position')
        .eq('request_id', requestId)
        .order('rank_position', { ascending: false })
        .limit(1)

      let nextRank = existing && existing.length > 0 && existing[0].rank_position
        ? existing[0].rank_position + 1
        : 1

      const entries = inputs.map((input, index) => ({
        ...input,
        rank_position: nextRank + index,
        status: 'proposed' as ShortlistStatus,
      }))

      const { data, error } = await supabase
        .from('request_shortlists')
        .insert(entries)
        .select()

      if (error) throw error
      return data as RequestShortlist[]
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: shortlistKeys.forRequest(variables[0].request_id) })
        queryClient.invalidateQueries({ queryKey: requestKeys.all })
      }
    },
  })
}

export function useUpdateShortlistEntry() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      requestId,
      updates,
    }: {
      id: string
      requestId: string
      updates: Partial<RequestShortlist>
    }) => {
      const { data, error } = await supabase
        .from('request_shortlists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: data as RequestShortlist, requestId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: shortlistKeys.forRequest(result.requestId) })
    },
  })
}

export function useRemoveFromShortlist() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, requestId }: { id: string; requestId: string }) => {
      const { error } = await supabase
        .from('request_shortlists')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { requestId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: shortlistKeys.forRequest(result.requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}

export function useReorderShortlist() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      orderedIds,
    }: {
      requestId: string
      orderedIds: string[]
    }) => {
      // Update each entry with new rank
      const updates = orderedIds.map((id, index) => ({
        id,
        rank_position: index + 1,
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('request_shortlists')
          .update({ rank_position: update.rank_position })
          .eq('id', update.id)

        if (error) throw error
      }

      return { requestId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: shortlistKeys.forRequest(result.requestId) })
    },
  })
}

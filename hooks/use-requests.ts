'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { flattenRequest, flattenRequests, nestRequirements } from '@/lib/utils/flatten-request'
import type {
  CustomerRequest,
  RequestStatus,
  RequestFilters,
  REQUEST_PIPELINE_STAGES,
} from '@/types/operations'

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════════

export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (filters: RequestFilters) => [...requestKeys.lists(), filters] as const,
  pipeline: () => [...requestKeys.all, 'pipeline'] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST REQUESTS
// ═══════════════════════════════════════════════════════════════════════════════

interface UseRequestsOptions {
  filters?: RequestFilters
  page?: number
  pageSize?: number
}

export function useRequests(options: UseRequestsOptions = {}) {
  const { filters = {}, page = 1, pageSize = 50 } = options
  const supabase = createClient()

  const queryFilters: RequestFilters & { page: number; pageSize: number } = {
    ...filters,
    page,
    pageSize,
  }

  return useQuery({
    queryKey: requestKeys.list(queryFilters),
    queryFn: async () => {
      let query = supabase
        .from('customer_requests')
        .select(`
          *,
          organization:crm_organizations!organization_id(id, name),
          shortlist_count:request_shortlists(count)
        `, { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,request_number.ilike.%${filters.search}%`)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
      }

      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }

      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id)
      }

      if (filters.role && filters.role.length > 0) {
        query = query.in('role_needed', filters.role)
      }

      if (filters.date_range?.start) {
        query = query.gte('start_date', filters.date_range.start)
      }

      if (filters.date_range?.end) {
        query = query.lte('start_date', filters.date_range.end)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      // Order by created_at desc
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      // Flatten requirements JSON and normalize shortlist_count
      const requests = flattenRequests(data || [])

      return {
        requests,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE DATA (for Kanban)
// ═══════════════════════════════════════════════════════════════════════════════

export function useRequestPipeline(filters?: Omit<RequestFilters, 'status'>) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...requestKeys.pipeline(), filters],
    queryFn: async () => {
      let query = supabase
        .from('customer_requests')
        .select(`
          *,
          organization:crm_organizations!organization_id(id, name)
        `)

      // Apply filters (excluding status since we want all pipeline stages)
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,request_number.ilike.%${filters.search}%`)
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
      }

      if (filters?.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }

      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id)
      }

      // Only get pipeline stages (exclude cancelled, expired, etc)
      const pipelineStages: RequestStatus[] = [
        'draft',
        'approved',
        'matching',
        'shortlisted',
        'offer_sent',
        'converted',
      ]
      query = query.in('status', pipelineStages)

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      // Flatten requirements JSON for all requests
      const flattenedData = flattenRequests(data || [])

      // Group by status
      const byStatus: Record<RequestStatus, CustomerRequest[]> = {
        draft: [],
        pending_approval: [],
        approved: [],
        matching: [],
        shortlisted: [],
        offer_sent: [],
        offer_accepted: [],
        offer_rejected: [],
        converted: [],
        on_hold: [],
        cancelled: [],
        expired: [],
      }

      for (const request of flattenedData) {
        if (byStatus[request.status]) {
          byStatus[request.status].push(request)
        }
      }

      // Calculate stats per column
      const stats = Object.entries(byStatus).reduce((acc, [status, requests]) => {
        acc[status as RequestStatus] = {
          count: requests.length,
          totalValue: requests.reduce((sum, r) => sum + (r.estimated_value_nok || 0), 0),
        }
        return acc
      }, {} as Record<RequestStatus, { count: number; totalValue: number }>)

      return { byStatus, stats }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

type CreateRequestInput = Omit<CustomerRequest, 'id' | 'request_number' | 'created_at' | 'updated_at' | 'shortlist_count' | 'organization' | 'contact'>

export function useCreateRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      // Generate request number
      const { count } = await supabase
        .from('customer_requests')
        .select('id', { count: 'exact', head: true })

      const currentCount = count || 0
      const year = new Date().getFullYear()
      const requestNumber = `REQ-${year}-${String(currentCount + 1).padStart(4, '0')}`

      const { data, error } = await supabase
        .from('customer_requests')
        .insert({
          ...input,
          request_number: requestNumber,
        })
        .select()
        .single()

      if (error) throw error
      return data as CustomerRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}

export function useUpdateRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<CustomerRequest>
    }) => {
      const { data, error } = await supabase
        .from('customer_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CustomerRequest
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
      queryClient.setQueryData(requestKeys.detail(data.id), data)
    },
  })
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: RequestStatus
    }) => {
      const updates: Partial<CustomerRequest> = { status }

      // Set timestamps based on status
      if (status === 'converted') {
        updates.converted_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('customer_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CustomerRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}

export function useDeleteRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}

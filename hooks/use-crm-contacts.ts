'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  CrmContact,
  CrmContactInsert,
  CrmContactUpdate,
  CrmContactFilters,
  CrmContactStatus,
  PipelineColumn,
  PipelineStats,
  CRM_CONTACT_STATUSES,
} from '@/types/crm'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface UseCrmContactsOptions {
  filters?: CrmContactFilters
  page?: number
  pageSize?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

interface CrmContactsResult {
  contacts: CrmContact[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ═══════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════

export const crmContactKeys = {
  all: ['crm-contacts'] as const,
  lists: () => [...crmContactKeys.all, 'list'] as const,
  list: (options: UseCrmContactsOptions) => [...crmContactKeys.lists(), options] as const,
  details: () => [...crmContactKeys.all, 'detail'] as const,
  detail: (id: string) => [...crmContactKeys.details(), id] as const,
  pipeline: () => [...crmContactKeys.all, 'pipeline'] as const,
  pipelineFiltered: (filters?: CrmContactFilters) => [...crmContactKeys.pipeline(), filters] as const,
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════

async function fetchCrmContacts(options: UseCrmContactsOptions): Promise<CrmContactsResult> {
  const supabase = createClient()
  const { filters, page = 1, pageSize = 25, sortField = 'updated_at', sortDirection = 'desc' } = options

  let query = supabase
    .from('crm_contacts')
    .select('*', { count: 'exact' })
    .is('archived_at', null)

  // Text search
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(`name.ilike.${searchTerm},company.ilike.${searchTerm},email.ilike.${searchTerm}`)
  }

  // Status filter
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  // Source filter
  if (filters?.source && filters.source.length > 0) {
    query = query.in('source', filters.source)
  }

  // Priority filter
  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  // Industry filter
  if (filters?.industry && filters.industry.length > 0) {
    query = query.in('industry', filters.industry)
  }

  // Owner filter
  if (filters?.owner_id) {
    query = query.eq('owner_id', filters.owner_id)
  }

  // Tags filter
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  // Has deal filter
  if (filters?.has_deal) {
    query = query.not('deal_value', 'is', null)
  }

  // Follow-up filters
  if (filters?.has_follow_up) {
    query = query.not('follow_up_date', 'is', null)
  }

  if (filters?.follow_up_overdue) {
    const today = new Date().toISOString().split('T')[0]
    query = query.lt('follow_up_date', today)
  }

  // Sorting
  const sortMapping: Record<string, string> = {
    name: 'name',
    company: 'company',
    deal_value: 'deal_value',
    probability: 'probability',
    follow_up_date: 'follow_up_date',
    created_at: 'created_at',
    updated_at: 'updated_at',
    last_contact_at: 'last_contact_at',
  }

  const dbSortField = sortMapping[sortField] || 'updated_at'
  query = query.order(dbSortField, { ascending: sortDirection === 'asc', nullsFirst: false })

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching CRM contacts:', error)
    throw error
  }

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    contacts: (data || []) as CrmContact[],
    total,
    page,
    pageSize,
    totalPages,
  }
}

async function fetchPipelineData(filters?: CrmContactFilters): Promise<{
  columns: PipelineColumn[]
  stats: PipelineStats
}> {
  const supabase = createClient()

  let query = supabase
    .from('crm_contacts')
    .select('*')
    .is('archived_at', null)
    .not('status', 'is', null)

  // Apply filters (same as list)
  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }
  if (filters?.industry && filters.industry.length > 0) {
    query = query.in('industry', filters.industry)
  }
  if (filters?.owner_id) {
    query = query.eq('owner_id', filters.owner_id)
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  const { data, error } = await query.order('deal_value', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching pipeline data:', error)
    throw error
  }

  const contacts = (data || []) as CrmContact[]

  // Group by status
  const statusOrder: CrmContactStatus[] = [
    'interested',
    'qualified',
    'contacted',
    'meeting_booked',
    'quote_sent',
    'negotiation',
    'won',
    'lost',
  ]

  const byStatus: Record<CrmContactStatus, CrmContact[]> = {} as any
  statusOrder.forEach(status => {
    byStatus[status] = []
  })

  contacts.forEach(contact => {
    const status = contact.status || 'interested'
    if (byStatus[status]) {
      byStatus[status].push(contact)
    }
  })

  const columns: PipelineColumn[] = statusOrder.map(status => {
    const statusContacts = byStatus[status] || []
    const totalValue = statusContacts.reduce((sum, c) => sum + (c.deal_value || 0), 0)

    return {
      id: status,
      label: status, // Labels will be applied in UI
      contacts: statusContacts,
      count: statusContacts.length,
      totalValue,
    }
  })

  // Calculate stats
  const totalContacts = contacts.length
  const totalValue = contacts.reduce((sum, c) => sum + (c.deal_value || 0), 0)
  const avgProbability = contacts.length > 0
    ? contacts.reduce((sum, c) => sum + (c.probability || 0), 0) / contacts.length
    : 0

  const stats: PipelineStats = {
    totalContacts,
    totalValue,
    avgProbability,
    byStatus: {} as any,
  }

  statusOrder.forEach(status => {
    const statusContacts = byStatus[status] || []
    stats.byStatus[status] = {
      count: statusContacts.length,
      value: statusContacts.reduce((sum, c) => sum + (c.deal_value || 0), 0),
    }
  })

  return { columns, stats }
}

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════

export function useCrmContacts(options: UseCrmContactsOptions = {}) {
  return useQuery({
    queryKey: crmContactKeys.list(options),
    queryFn: () => fetchCrmContacts(options),
    placeholderData: (previousData) => previousData,
  })
}

export function useCrmPipeline(filters?: CrmContactFilters) {
  return useQuery({
    queryKey: crmContactKeys.pipelineFiltered(filters),
    queryFn: () => fetchPipelineData(filters),
    placeholderData: (previousData) => previousData,
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export function useCreateCrmContact() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (contact: CrmContactInsert) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert({
          ...contact,
          manual_entry: true,
        })
        .select()
        .single()

      if (error) throw error
      return data as CrmContact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmContactKeys.all })
    },
  })
}

export function useUpdateCrmContact() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: CrmContactUpdate
    }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CrmContact
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: crmContactKeys.all })
      queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(id) })
    },
  })
}

export function useUpdateCrmContactStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: CrmContactStatus
    }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CrmContact
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: crmContactKeys.all })
      queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(id) })
    },
  })
}

export function useArchiveCrmContact() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string
      reason?: string
    }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update({
          archived_at: new Date().toISOString(),
          archived_reason: reason || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CrmContact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmContactKeys.all })
    },
  })
}

export function useDeleteCrmContact() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmContactKeys.all })
    },
  })
}

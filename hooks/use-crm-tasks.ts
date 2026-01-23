'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  CrmTask,
  CrmTaskInsert,
  CrmTaskUpdate,
  CrmTaskFilters,
  CrmTaskStatus,
} from '@/types/crm'
import { crmContactKeys } from './use-crm-contacts'

// ═══════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════

export const crmTaskKeys = {
  all: ['crm-tasks'] as const,
  lists: () => [...crmTaskKeys.all, 'list'] as const,
  list: (filters?: CrmTaskFilters) => [...crmTaskKeys.lists(), filters] as const,
  byContact: (contactId: string) => [...crmTaskKeys.all, 'contact', contactId] as const,
  byDeal: (dealId: string) => [...crmTaskKeys.all, 'deal', dealId] as const,
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════

async function fetchTasks(filters?: CrmTaskFilters): Promise<CrmTask[]> {
  const supabase = createClient()

  let query = supabase
    .from('crm_tasks')
    .select('*')
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters?.contact_id) {
    query = query.eq('contact_id', filters.contact_id)
  }

  if (filters?.deal_id) {
    query = query.eq('deal_id', filters.deal_id)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.category && filters.category.length > 0) {
    query = query.in('category', filters.category)
  }

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }

  if (filters?.due_date_from) {
    query = query.gte('due_date', filters.due_date_from)
  }

  if (filters?.due_date_to) {
    query = query.lte('due_date', filters.due_date_to)
  }

  if (filters?.overdue) {
    const today = new Date().toISOString()
    query = query.lt('due_date', today).neq('status', 'done')
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }

  return (data || []) as CrmTask[]
}

async function fetchContactTasks(contactId: string): Promise<CrmTask[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crm_tasks')
    .select('*')
    .eq('contact_id', contactId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching contact tasks:', error)
    throw error
  }

  return (data || []) as CrmTask[]
}

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════

export function useCrmTasks(filters?: CrmTaskFilters) {
  return useQuery({
    queryKey: crmTaskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
    placeholderData: (previousData) => previousData,
  })
}

export function useCrmContactTasks(contactId: string | undefined) {
  return useQuery({
    queryKey: crmTaskKeys.byContact(contactId || ''),
    queryFn: () => fetchContactTasks(contactId!),
    enabled: !!contactId,
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export function useCreateCrmTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (task: CrmTaskInsert) => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .insert(task)
        .select()
        .single()

      if (error) throw error
      return data as CrmTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmTaskKeys.all })
      if (data.contact_id) {
        queryClient.invalidateQueries({ queryKey: crmTaskKeys.byContact(data.contact_id) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(data.contact_id) })
      }
      if (data.deal_id) {
        queryClient.invalidateQueries({ queryKey: crmTaskKeys.byDeal(data.deal_id) })
      }
    },
  })
}

export function useUpdateCrmTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: CrmTaskUpdate
    }) => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CrmTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmTaskKeys.all })
      if (data.contact_id) {
        queryClient.invalidateQueries({ queryKey: crmTaskKeys.byContact(data.contact_id) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(data.contact_id) })
      }
      if (data.deal_id) {
        queryClient.invalidateQueries({ queryKey: crmTaskKeys.byDeal(data.deal_id) })
      }
    },
  })
}

export function useCompleteCrmTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      completedBy,
    }: {
      id: string
      completedBy?: string
    }) => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .update({
          status: 'done' as CrmTaskStatus,
          completed_at: new Date().toISOString(),
          completed_by: completedBy || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CrmTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmTaskKeys.all })
      if (data.contact_id) {
        queryClient.invalidateQueries({ queryKey: crmTaskKeys.byContact(data.contact_id) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(data.contact_id) })
      }
    },
  })
}

export function useDeleteCrmTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      deletedBy,
    }: {
      id: string
      deletedBy?: string
    }) => {
      // Soft delete
      const { data, error } = await supabase
        .from('crm_tasks')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CrmTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmTaskKeys.all })
      if (data.contact_id) {
        queryClient.invalidateQueries({ queryKey: crmTaskKeys.byContact(data.contact_id) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(data.contact_id) })
      }
    },
  })
}

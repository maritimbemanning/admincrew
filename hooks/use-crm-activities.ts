'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  CrmActivity,
  CrmActivityInsert,
  CrmActivityUpdate,
  CrmActivityFilters,
} from '@/types/crm'
import { crmContactKeys } from './use-crm-contacts'

// ═══════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════

export const crmActivityKeys = {
  all: ['crm-activities'] as const,
  lists: () => [...crmActivityKeys.all, 'list'] as const,
  list: (filters?: CrmActivityFilters) => [...crmActivityKeys.lists(), filters] as const,
  byContact: (contactId: string) => [...crmActivityKeys.all, 'contact', contactId] as const,
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════

async function fetchActivities(filters?: CrmActivityFilters): Promise<CrmActivity[]> {
  const supabase = createClient()

  let query = supabase
    .from('crm_activities')
    .select('*')
    .order('date', { ascending: false })

  if (filters?.contact_id) {
    query = query.eq('contact_id', filters.contact_id)
  }

  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type)
  }

  if (filters?.date_from) {
    query = query.gte('date', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('date', filters.date_to)
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching activities:', error)
    throw error
  }

  return (data || []) as CrmActivity[]
}

async function fetchContactActivities(contactId: string): Promise<CrmActivity[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('contact_id', contactId)
    .order('date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching contact activities:', error)
    throw error
  }

  return (data || []) as CrmActivity[]
}

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════

export function useCrmActivities(filters?: CrmActivityFilters) {
  return useQuery({
    queryKey: crmActivityKeys.list(filters),
    queryFn: () => fetchActivities(filters),
    placeholderData: (previousData) => previousData,
  })
}

export function useCrmContactActivities(contactId: string | undefined) {
  return useQuery({
    queryKey: crmActivityKeys.byContact(contactId || ''),
    queryFn: () => fetchContactActivities(contactId!),
    enabled: !!contactId,
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export function useCreateCrmActivity() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (activity: CrmActivityInsert) => {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          ...activity,
          date: activity.date || new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Also update contact's last_contact_at
      if (activity.contact_id) {
        await supabase
          .from('crm_contacts')
          .update({
            last_contact_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Update next activity/follow-up if provided
            ...(activity.next_activity && { next_activity: activity.next_activity }),
            ...(activity.next_follow_up_date && { follow_up_date: activity.next_follow_up_date }),
          })
          .eq('id', activity.contact_id)
      }

      return data as CrmActivity
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmActivityKeys.all })
      if (data.contact_id) {
        queryClient.invalidateQueries({ queryKey: crmActivityKeys.byContact(data.contact_id) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(data.contact_id) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.all })
      }
    },
  })
}

export function useUpdateCrmActivity() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: CrmActivityUpdate
    }) => {
      const { data, error } = await supabase
        .from('crm_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CrmActivity
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmActivityKeys.all })
      if (data.contact_id) {
        queryClient.invalidateQueries({ queryKey: crmActivityKeys.byContact(data.contact_id) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(data.contact_id) })
      }
    },
  })
}

export function useDeleteCrmActivity() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // First get the activity to know the contact_id
      const { data: activity } = await supabase
        .from('crm_activities')
        .select('contact_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', id)

      if (error) throw error
      return activity?.contact_id
    },
    onSuccess: (contactId) => {
      queryClient.invalidateQueries({ queryKey: crmActivityKeys.all })
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: crmActivityKeys.byContact(contactId) })
        queryClient.invalidateQueries({ queryKey: crmContactKeys.detail(contactId) })
      }
    },
  })
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CrmContact } from '@/types/crm'

// ═══════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════

export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (filters: ContactFilters) => [...contactsKeys.lists(), filters] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

// Alias for backward compatibility
type Contact = CrmContact

interface ContactFilters {
  search?: string
  organization_id?: string
  is_primary?: boolean
  page?: number
  limit?: number
}

interface ContactsResponse {
  data: Contact[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook for fetching a list of contacts with filters
 */
export function useContacts(filters: ContactFilters = {}) {
  const { search, organization_id, is_primary, page = 1, limit = 20 } = filters

  return useQuery({
    queryKey: contactsKeys.list(filters),
    queryFn: async (): Promise<ContactsResponse> => {
      const supabase = createClient()
      
      let query = supabase
        .from('crm_contacts')
        .select(`
          *,
          organization:crm_organizations(id, name)
        `, { count: 'exact' })

      // Apply filters
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      if (organization_id) {
        query = query.eq('organization_id', organization_id)
      }

      if (is_primary !== undefined) {
        query = query.eq('is_primary', is_primary)
      }

      // Pagination
      const offset = (page - 1) * limit
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        meta: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      }
    },
  })
}

/**
 * Hook for fetching a single contact
 */
export function useContact(id: string | null) {
  return useQuery({
    queryKey: contactsKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_contacts')
        .select(`
          *,
          organization:crm_organizations(id, name, org_number)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Contact
    },
    enabled: !!id,
  })
}

/**
 * Hook for creating a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contact)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all })
    },
  })
}

/**
 * Hook for updating a contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all })
      queryClient.setQueryData(contactsKeys.detail(data.id), data)
    },
  })
}

/**
 * Hook for deleting a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all })
      queryClient.removeQueries({ queryKey: contactsKeys.detail(id) })
    },
  })
}

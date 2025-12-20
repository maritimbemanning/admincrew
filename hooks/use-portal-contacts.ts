// hooks/use-portal-contacts.ts
// Hook for å hente og håndtere kontakthenvendelser fra bluecrew.no
// Tabell: contacts (ikke portal_contacts!)
// Kolonner: navn, epost, telefon, melding, status, metadata

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { PortalContact, ContactStatus } from '@/types/portal'

interface UsePortalContactsOptions {
  status?: ContactStatus
  search?: string
  limit?: number
}

export function usePortalContacts(options: UsePortalContactsOptions = {}) {
  const { status, search, limit = 50 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['portal-contacts', { status, search, limit }],
    queryFn: async () => {
      let query = supabase
        .from('contacts')  // NB: "contacts" ikke "portal_contacts"!
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`navn.ilike.%${search}%,epost.ilike.%${search}%,melding.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as PortalContact[]
    },
  })
}

export function usePortalContact(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['portal-contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as PortalContact
    },
    enabled: !!id,
  })
}

export function useUpdatePortalContactStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-contacts'] })
    },
  })
}

export function usePortalContactStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['portal-contacts-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('status')

      if (error) throw error

      return {
        total: data.length,
        new: data.filter(c => c.status === 'new').length,
        processed: data.filter(c => c.status === 'processed').length,
        archived: data.filter(c => c.status === 'archived').length,
      }
    },
  })
}

// hooks/use-staffing-needs.ts
// Hook for å hente og håndtere bemanningsbehov fra bluecrew.no
// Tabell: staffing_needs
// Kolonner: fartoytype, stillinger (TEXT!), antall, oppstart (TEXT!), rotasjon,
//           kontakt_navn, kontakt_epost, kontakt_telefon, bedrift, merknad, status

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { StaffingNeed, StaffingNeedStatus } from '@/types/portal'

interface UseStaffingNeedsOptions {
  status?: StaffingNeedStatus
  search?: string
  limit?: number
}

export function useStaffingNeeds(options: UseStaffingNeedsOptions = {}) {
  const { status, search, limit = 50 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['staffing-needs', { status, search, limit }],
    queryFn: async () => {
      let query = supabase
        .from('staffing_needs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`bedrift.ilike.%${search}%,kontakt_navn.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as StaffingNeed[]
    },
  })
}

export function useStaffingNeed(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['staffing-need', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staffing_needs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as StaffingNeed
    },
    enabled: !!id,
  })
}

export function useUpdateStaffingNeedStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StaffingNeedStatus }) => {
      const { data, error } = await supabase
        .from('staffing_needs')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffing-needs'] })
    },
  })
}

export function useConvertToCustomerRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (need: StaffingNeed) => {
      // 1. Sjekk/opprett kunde i CRM
      let organizationId: string | null = null

      if (need.bedrift) {
        const { data: existingOrg } = await supabase
          .from('crm_organizations')
          .select('id')
          .ilike('name', need.bedrift)
          .single()

        if (existingOrg) {
          organizationId = existingOrg.id
        } else {
          const { data: newOrg, error: orgError } = await supabase
            .from('crm_organizations')
            .insert({
              name: need.bedrift,
              industry: 'maritime',
              customer_type: 'prospect',
            })
            .select('id')
            .single()

          if (orgError) throw orgError
          organizationId = newOrg.id
        }
      }

      // 2. Opprett/finn kontaktperson i CRM
      let contactId: string | null = null

      if (need.kontakt_epost && organizationId) {
        const { data: existingContact } = await supabase
          .from('crm_contacts')
          .select('id')
          .eq('email', need.kontakt_epost.toLowerCase())
          .single()

        if (existingContact) {
          contactId = existingContact.id
        } else {
          const nameParts = (need.kontakt_navn || '').trim().split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          const { data: newContact, error: contactError } = await supabase
            .from('crm_contacts')
            .insert({
              first_name: firstName,
              last_name: lastName,
              email: need.kontakt_epost.toLowerCase(),
              phone: need.kontakt_telefon,
              organization_id: organizationId,
            })
            .select('id')
            .single()

          if (contactError) throw contactError
          contactId = newContact.id
        }
      }

      // 3. Opprett customer_request
      const { data: request, error: requestError } = await supabase
        .from('customer_requests')
        .insert({
          organization_id: organizationId!,
          contact_id: contactId,
          title: `Bemanningsbehov: ${need.stillinger || 'Ikke spesifisert'} (${need.antall || 1} stk)`,
          description: need.merknad || `Fartøytype: ${need.fartoytype || 'Ikke spesifisert'}, Oppstart: ${need.oppstart || 'Fleksibelt'}, Rotasjon: ${need.rotasjon || 'Ikke spesifisert'}`,
          role_needed: need.stillinger || 'Ikke spesifisert',
          quantity: need.antall || 1,
          start_date: new Date().toISOString().split('T')[0], // Bruker dagens dato som fallback
          vessel_type: need.fartoytype,
          status: 'pending_approval',
          priority: 'medium',
        })
        .select('id')
        .single()

      if (requestError) throw requestError

      // 4. Marker staffing need som konvertert
      await supabase
        .from('staffing_needs')
        .update({ status: 'converted' })
        .eq('id', need.id)

      return {
        requestId: request.id,
        organizationId,
        contactId,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffing-needs'] })
      queryClient.invalidateQueries({ queryKey: ['customer-requests'] })
      queryClient.invalidateQueries({ queryKey: ['crm-organizations'] })
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] })
    },
  })
}

export function useStaffingNeedStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['staffing-needs-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staffing_needs')
        .select('status, fartoytype')

      if (error) throw error

      const stats = {
        total: data.length,
        new: data.filter(n => n.status === 'new').length,
        contacted: data.filter(n => n.status === 'contacted').length,
        converted: data.filter(n => n.status === 'converted').length,
        byFartoytype: {} as Record<string, number>,
      }

      data.forEach(n => {
        if (n.fartoytype) {
          stats.byFartoytype[n.fartoytype] = (stats.byFartoytype[n.fartoytype] || 0) + 1
        }
      })

      return stats
    },
  })
}

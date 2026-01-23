// hooks/use-interest-leads.ts
// Hook for å hente og håndtere interesse-leads fra bluecrew.no

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { InterestLead, LeadStatus } from '@/types/portal'

interface UseInterestLeadsOptions {
  status?: LeadStatus
  type?: string
  search?: string
  limit?: number
}

export function useInterestLeads(options: UseInterestLeadsOptions = {}) {
  const { status, type, search, limit = 50 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['interest-leads', { status, type, search, limit }],
    queryFn: async () => {
      let query = supabase
        .from('interest_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (type) {
        query = query.eq('type', type)
      }

      if (search) {
        query = query.or(`navn.ilike.%${search}%,epost.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as InterestLead[]
    },
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { data, error } = await supabase
        .from('interest_leads')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interest-leads'] })
    },
  })
}

export function useConvertLeadToCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (lead: InterestLead) => {
      // 1. Sjekk om kandidat allerede finnes
      const { data: existing } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', lead.epost.toLowerCase())
        .single()

      if (existing) {
        // Marker lead som konvertert
        await supabase
          .from('interest_leads')
          .update({ status: 'converted' })
          .eq('id', lead.id)

        return { candidateId: existing.id, created: false }
      }

      // 2. Opprett ny kandidat
      const nameParts = lead.navn.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const { data: newCandidate, error: insertError } = await supabase
        .from('candidates')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: lead.epost.toLowerCase(),
          phone: lead.telefon,
          availability_status: 'available',
          compliance_status: 'not_started',
          source: 'interest_lead',
          source_details: {
            lead_id: lead.id,
            type: lead.type,
          },
          primary_role: (lead.metadata?.stilling as string) || 'Ikke spesifisert',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // 3. Marker lead som konvertert
      await supabase
        .from('interest_leads')
        .update({ status: 'converted' })
        .eq('id', lead.id)

      return { candidateId: newCandidate.id, created: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interest-leads'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useInterestLeadStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['interest-leads-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interest_leads')
        .select('status, type')

      if (error) throw error

      const stats = {
        total: data.length,
        new: data.filter(l => l.status === 'new').length,
        contacted: data.filter(l => l.status === 'contacted').length,
        converted: data.filter(l => l.status === 'converted').length,
        byType: {} as Record<string, number>,
      }

      data.forEach(l => {
        stats.byType[l.type] = (stats.byType[l.type] || 0) + 1
      })

      return stats
    },
  })
}

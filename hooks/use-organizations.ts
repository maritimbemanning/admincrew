import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Organization {
  id: string
  name: string
  org_number: string | null
  industry: string | null
  website: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string
  phone: string | null
  email: string | null
  notes: string | null
  pipeline_stage: string
  estimated_value: number | null
  assigned_to: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface OrganizationInput {
  name: string
  org_number?: string
  industry?: string
  website?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  phone?: string
  email?: string
  notes?: string
  pipeline_stage?: string
  estimated_value?: number
  assigned_to?: string
  tags?: string[]
}

interface UseOrganizationsOptions {
  search?: string
  industry?: string
  pipelineStage?: string
  limit?: number
  offset?: number
}

export function useOrganizations(options: UseOrganizationsOptions = {}) {
  const { search, industry, pipelineStage, limit = 50, offset = 0 } = options

  return useQuery({
    queryKey: ['organizations', { search, industry, pipelineStage, limit, offset }],
    queryFn: async () => {
      const supabase = createClient()
      
      let query = supabase
        .from('crm_organizations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,org_number.ilike.%${search}%`)
      }

      if (industry) {
        query = query.eq('industry', industry)
      }

      if (pipelineStage) {
        query = query.eq('pipeline_stage', pipelineStage)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        organizations: data as Organization[],
        count: count ?? 0,
      }
    },
  })
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      if (!id) throw new Error('Organization ID required')
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return data as Organization
    },
    enabled: !!id,
  })
}

export function useOrganizationContacts(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-contacts', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('is_primary', { ascending: false })

      if (error) throw error

      return data
    },
    enabled: !!organizationId,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: OrganizationInput) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_organizations')
        .insert(input)
        .select()
        .single()

      if (error) throw error

      return data as Organization
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<OrganizationInput> & { id: string }) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_organizations')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data as Organization
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization', data.id] })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('crm_organizations')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

// Pipeline utilities
export const pipelineStages = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacted', label: 'Kontaktet' },
  { value: 'meeting_scheduled', label: 'Møte booket' },
  { value: 'proposal_sent', label: 'Tilbud sendt' },
  { value: 'negotiation', label: 'Forhandling' },
  { value: 'won', label: 'Kunde' },
  { value: 'lost', label: 'Tapt' },
  { value: 'churned', label: 'Churned' },
]

export const industries = [
  { value: 'technology', label: 'Teknologi' },
  { value: 'healthcare', label: 'Helse' },
  { value: 'finance', label: 'Finans' },
  { value: 'manufacturing', label: 'Industri' },
  { value: 'retail', label: 'Handel' },
  { value: 'construction', label: 'Bygg & Anlegg' },
  { value: 'energy', label: 'Energi' },
  { value: 'transport', label: 'Transport' },
  { value: 'consulting', label: 'Konsulentvirksomhet' },
  { value: 'other', label: 'Annet' },
]

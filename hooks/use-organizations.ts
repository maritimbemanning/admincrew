import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type PipelineStage = 
  | 'lead' 
  | 'contacted' 
  | 'meeting_scheduled' 
  | 'proposal_sent' 
  | 'negotiation' 
  | 'won' 
  | 'lost' 
  | 'churned'

export interface Organization {
  id: string
  name: string
  org_number: string | null
  industry: string | null
  company_size: string | null
  customer_type: string | null
  website: string | null
  email: string | null
  phone: string | null
  address_street: string | null
  address_postal_code: string | null
  address_city: string | null
  address_country: string
  logo_url: string | null
  pipeline_stage: PipelineStage
  pipeline_entered_at: string | null
  pipeline_won_at: string | null
  pipeline_lost_at: string | null
  pipeline_lost_reason: string | null
  owner_id: string | null
  estimated_annual_value_nok: number | null
  lifetime_value_nok: number | null
  outstanding_amount_nok: number | null
  stats: Record<string, unknown> | null
  preferences: Record<string, unknown> | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface OrganizationInput {
  name: string
  org_number?: string
  industry?: string
  company_size?: string
  customer_type?: string
  website?: string
  email?: string
  phone?: string
  address_street?: string
  address_postal_code?: string
  address_city?: string
  address_country?: string
  logo_url?: string
  pipeline_stage?: PipelineStage
  owner_id?: string
  estimated_annual_value_nok?: number
  notes?: string
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
export const pipelineStages: { 
  value: PipelineStage
  label: string
  color: string
  bgColor: string
}[] = [
  { value: 'lead', label: 'Lead', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  { value: 'contacted', label: 'Kontaktet', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { value: 'meeting_scheduled', label: 'Møte booket', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  { value: 'proposal_sent', label: 'Tilbud sendt', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { value: 'negotiation', label: 'Forhandling', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  { value: 'won', label: 'Kunde ✓', color: 'text-green-700', bgColor: 'bg-green-100' },
  { value: 'lost', label: 'Tapt', color: 'text-red-700', bgColor: 'bg-red-100' },
  { value: 'churned', label: 'Churned', color: 'text-gray-700', bgColor: 'bg-gray-100' },
]

export const industries = [
  { value: 'aquaculture', label: 'Havbruk' },
  { value: 'offshore', label: 'Offshore' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'fishing', label: 'Fiskeri' },
  { value: 'maritime_services', label: 'Maritime tjenester' },
  { value: 'energy', label: 'Energi' },
  { value: 'other', label: 'Annet' },
]

// Hook for pipeline kanban view - groups organizations by stage
export function useOrganizationsPipeline() {
  return useQuery({
    queryKey: ['organizations-pipeline'],
    queryFn: async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_organizations')
        .select('*')
        .is('archived_at', null)
        .order('pipeline_entered_at', { ascending: false })

      if (error) throw error

      const orgs = data as Organization[]

      // Group by pipeline stage
      const columns = pipelineStages
        .filter(s => s.value !== 'churned') // Hide churned from main view
        .map(stage => {
          const stageOrgs = orgs.filter(o => o.pipeline_stage === stage.value)
          return {
            id: stage.value,
            label: stage.label,
            color: stage.color,
            bgColor: stage.bgColor,
            organizations: stageOrgs,
            count: stageOrgs.length,
            totalValue: stageOrgs.reduce((sum, o) => sum + (o.estimated_annual_value_nok || 0), 0),
          }
        })

      const stats = {
        totalOrgs: orgs.length,
        totalValue: orgs.reduce((sum, o) => sum + (o.estimated_annual_value_nok || 0), 0),
        wonCount: orgs.filter(o => o.pipeline_stage === 'won').length,
        wonValue: orgs.filter(o => o.pipeline_stage === 'won').reduce((sum, o) => sum + (o.estimated_annual_value_nok || 0), 0),
      }

      return { columns, stats }
    },
  })
}

// Hook for updating pipeline stage (for drag-drop)
export function useUpdateOrganizationStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: PipelineStage }) => {
      const supabase = createClient()

      const updates: Record<string, unknown> = {
        pipeline_stage: stage,
        updated_at: new Date().toISOString(),
      }

      // Track win/loss dates
      if (stage === 'won') {
        updates.pipeline_won_at = new Date().toISOString()
        updates.customer_type = 'customer'
      } else if (stage === 'lost') {
        updates.pipeline_lost_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('crm_organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Organization
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

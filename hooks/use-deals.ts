import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type DealStage = 
  | 'qualification'
  | 'needs_analysis'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface Deal {
  id: string
  organization_id: string
  contact_id: string | null
  title: string
  description: string | null
  value_nok: number | null
  currency: string
  stage: DealStage
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  won_at: string | null
  lost_at: string | null
  lost_reason: string | null
  owner_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
  // Joined data
  organization?: {
    id: string
    name: string
  }
  contact?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface DealInput {
  organization_id: string
  contact_id?: string
  title: string
  description?: string
  value_nok?: number
  stage?: DealStage
  probability?: number
  expected_close_date?: string
  owner_id?: string
  notes?: string
}

interface UseDealsOptions {
  stage?: DealStage
  organizationId?: string
  search?: string
  includeArchived?: boolean
  limit?: number
}

export const dealStages: {
  value: DealStage
  label: string
  probability: number
  color: string
  bgColor: string
}[] = [
  { value: 'qualification', label: 'Kvalifisering', probability: 10, color: 'text-slate-700', bgColor: 'bg-slate-100' },
  { value: 'needs_analysis', label: 'Behovsanalyse', probability: 25, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { value: 'proposal', label: 'Tilbud', probability: 50, color: 'text-purple-700', bgColor: 'bg-purple-100' },
  { value: 'negotiation', label: 'Forhandling', probability: 75, color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { value: 'closed_won', label: 'Vunnet ✓', probability: 100, color: 'text-green-700', bgColor: 'bg-green-100' },
  { value: 'closed_lost', label: 'Tapt', probability: 0, color: 'text-red-700', bgColor: 'bg-red-100' },
]

export function useDeals(options: UseDealsOptions = {}) {
  const { stage, organizationId, search, includeArchived = false, limit = 100 } = options

  return useQuery({
    queryKey: ['deals', { stage, organizationId, search, includeArchived, limit }],
    queryFn: async () => {
      const supabase = createClient()
      
      let query = supabase
        .from('crm_deals')
        .select(`
          *,
          organization:crm_organizations(id, name),
          contact:crm_contacts(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!includeArchived) {
        query = query.is('archived_at', null)
      }

      if (stage) {
        query = query.eq('stage', stage)
      }

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return data as Deal[]
    },
  })
}

export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      if (!id) throw new Error('Deal ID required')
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          organization:crm_organizations(id, name),
          contact:crm_contacts(id, first_name, last_name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return data as Deal
    },
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DealInput) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_deals')
        .insert(input)
        .select()
        .single()

      if (error) throw error

      return data as Deal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DealInput> & { id: string }) => {
      const supabase = createClient()

      const updates: Record<string, unknown> = {
        ...input,
        updated_at: new Date().toISOString(),
      }

      // Track win/loss
      if (input.stage === 'closed_won') {
        updates.won_at = new Date().toISOString()
        updates.actual_close_date = new Date().toISOString().split('T')[0]
      } else if (input.stage === 'closed_lost') {
        updates.lost_at = new Date().toISOString()
        updates.actual_close_date = new Date().toISOString().split('T')[0]
      }
      
      const { data, error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data as Deal
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deal', data.id] })
    },
  })
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const supabase = createClient()

      const stageInfo = dealStages.find(s => s.value === stage)
      
      const updates: Record<string, unknown> = {
        stage,
        probability: stageInfo?.probability || 0,
        updated_at: new Date().toISOString(),
      }

      // Track win/loss
      if (stage === 'closed_won') {
        updates.won_at = new Date().toISOString()
        updates.actual_close_date = new Date().toISOString().split('T')[0]
      } else if (stage === 'closed_lost') {
        updates.lost_at = new Date().toISOString()
        updates.actual_close_date = new Date().toISOString().split('T')[0]
      }
      
      const { data, error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data as Deal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })
}

export function useDealsPipeline() {
  return useQuery({
    queryKey: ['deals-pipeline'],
    queryFn: async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          organization:crm_organizations(id, name)
        `)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      const deals = data as Deal[]

      // Group by stage
      const columns = dealStages
        .filter(s => s.value !== 'closed_lost') // Hide lost from main view
        .map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.value)
          const totalValue = stageDeals.reduce((sum, d) => sum + (d.value_nok || 0), 0)
          const weightedValue = stageDeals.reduce((sum, d) => sum + ((d.value_nok || 0) * (d.probability / 100)), 0)
          
          return {
            id: stage.value,
            label: stage.label,
            color: stage.color,
            bgColor: stage.bgColor,
            probability: stage.probability,
            deals: stageDeals,
            count: stageDeals.length,
            totalValue,
            weightedValue,
          }
        })

      const allDeals = deals.filter(d => d.stage !== 'closed_lost')
      const stats = {
        totalDeals: allDeals.length,
        totalValue: allDeals.reduce((sum, d) => sum + (d.value_nok || 0), 0),
        weightedValue: allDeals.reduce((sum, d) => sum + ((d.value_nok || 0) * (d.probability / 100)), 0),
        wonDeals: deals.filter(d => d.stage === 'closed_won').length,
        wonValue: deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (d.value_nok || 0), 0),
      }

      return { columns, stats }
    },
  })
}



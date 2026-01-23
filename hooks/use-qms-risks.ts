'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Risk,
  RiskFilters,
  CreateRiskInput,
  UpdateRiskInput,
  RiskStatus,
} from '@/types/qms'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const riskKeys = {
  all: ['risks'] as const,
  lists: () => [...riskKeys.all, 'list'] as const,
  list: (filters: RiskFilters) => [...riskKeys.lists(), filters] as const,
  details: () => [...riskKeys.all, 'detail'] as const,
  detail: (id: string) => [...riskKeys.details(), id] as const,
  matrix: () => [...riskKeys.all, 'matrix'] as const,
  highRisks: () => [...riskKeys.all, 'high'] as const,
}

// ============================================================================
// RISK LIST HOOK
// ============================================================================

interface UseRisksOptions {
  filters?: RiskFilters
  page?: number
  pageSize?: number
}

export function useRisks(options: UseRisksOptions = {}) {
  const { filters = {}, page = 1, pageSize = 20 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: riskKeys.list({ ...filters, page, pageSize } as RiskFilters),
    queryFn: async () => {
      let query = supabase
        .from('qms_risks')
        .select(
          `
          *,
          owner:user_profiles!qms_risks_owner_id_fkey(id, full_name, email)
        `,
          { count: 'exact' }
        )
        .is('archived_at', null)
        .order('risk_score', { ascending: false })

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,risk_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.min_score !== undefined) {
        query = query.gte('risk_score', filters.min_score)
      }

      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        risks: data as Risk[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

// ============================================================================
// SINGLE RISK HOOK
// ============================================================================

export function useRisk(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: riskKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qms_risks')
        .select(
          `
          *,
          owner:user_profiles!qms_risks_owner_id_fkey(id, full_name, email)
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Risk
    },
    enabled: !!id,
  })
}

// ============================================================================
// RISK MATRIX DATA HOOK
// ============================================================================

export function useRiskMatrix() {
  const supabase = createClient()

  return useQuery({
    queryKey: riskKeys.matrix(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qms_risks')
        .select('id, title, risk_number, likelihood, impact, risk_score, status, category')
        .is('archived_at', null)
        .not('status', 'eq', 'closed')
        .order('risk_score', { ascending: false })

      if (error) throw error

      // Group by likelihood/impact for matrix display
      const matrix: Record<string, Risk[]> = {}
      for (let l = 1; l <= 5; l++) {
        for (let i = 1; i <= 5; i++) {
          matrix[`${l}-${i}`] = []
        }
      }

      data.forEach((risk) => {
        const key = `${risk.likelihood}-${risk.impact}`
        if (matrix[key]) {
          matrix[key].push(risk as Risk)
        }
      })

      return {
        risks: data as Risk[],
        matrix,
        summary: {
          total: data.length,
          critical: data.filter((r) => r.risk_score >= 17).length,
          high: data.filter((r) => r.risk_score >= 10 && r.risk_score < 17).length,
          medium: data.filter((r) => r.risk_score >= 5 && r.risk_score < 10).length,
          low: data.filter((r) => r.risk_score < 5).length,
        },
      }
    },
  })
}

// ============================================================================
// HIGH RISKS HOOK
// ============================================================================

export function useHighRisks() {
  const supabase = createClient()

  return useQuery({
    queryKey: riskKeys.highRisks(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qms_risks')
        .select(
          `
          *,
          owner:user_profiles!qms_risks_owner_id_fkey(id, full_name, email)
        `
        )
        .gte('risk_score', 10)
        .is('archived_at', null)
        .not('status', 'eq', 'closed')
        .order('risk_score', { ascending: false })

      if (error) throw error
      return data as Risk[]
    },
  })
}

// ============================================================================
// RISK MUTATIONS
// ============================================================================

export function useCreateRisk() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateRiskInput) => {
      // Generate risk number
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('qms_risks')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)

      const currentCount = count || 0
      const riskNumber = `RISK-${year}-${String(currentCount + 1).padStart(4, '0')}`

      const { data, error } = await supabase
        .from('qms_risks')
        .insert({
          ...input,
          risk_number: riskNumber,
          status: 'identified',
        })
        .select()
        .single()

      if (error) throw error
      return data as Risk
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all })
    },
  })
}

export function useUpdateRisk() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateRiskInput & { id: string }) => {
      const { data, error } = await supabase
        .from('qms_risks')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Risk
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all })
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(data.id) })
    },
  })
}

export function useUpdateRiskStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RiskStatus }) => {
      const { data, error } = await supabase
        .from('qms_risks')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Risk
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all })
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(data.id) })
    },
  })
}

export function useArchiveRisk() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('qms_risks')
        .update({
          archived_at: new Date().toISOString(),
          status: 'closed',
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Risk
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all })
    },
  })
}

// ============================================================================
// RESIDUAL RISK UPDATE
// ============================================================================

export function useUpdateResidualRisk() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      residual_likelihood,
      residual_impact,
    }: {
      id: string
      residual_likelihood: number
      residual_impact: number
    }) => {
      const residual_score = residual_likelihood * residual_impact

      const { data, error } = await supabase
        .from('qms_risks')
        .update({
          residual_likelihood,
          residual_impact,
          residual_score,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Risk
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all })
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(data.id) })
    },
  })
}
